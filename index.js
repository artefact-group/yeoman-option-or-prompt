'use strict';

module.exports = function(prompts) {
  // This method will only show prompts that haven't been supplied as options. This makes the generator more composable.
  const filteredPrompts = [];
  const props = new Map();

  prompts.forEach(function prompts(prompt) {
    const option = this.options[prompt.name];

    if (option === undefined) {
      // No option supplied, user will be prompted
      filteredPrompts.push(prompt);
    } else {
      // Options supplied, store it
      props[prompt.name] = normalize(option);
    }
  }, this);

  if (!filteredPrompts.length) {
    // No prompting required call the callback right away.
    return Promise.resolve(props);
  }

  return new Promise(async resolve => {
    for (let i = 0; i < filteredPrompts.length; i++) {
      let filteredPrompt = filteredPrompts[i];
      var isWhenConditionFulfilled = typeof filteredPrompt.when !== 'function' ||
        (typeof filteredPrompt.when === 'function' && filteredPrompt.when(props));
      if (isWhenConditionFulfilled) {
        delete filteredPrompt.when;
        if (typeof filteredPrompt.choices === 'function') {
          // We need to manually craft choices as YO's internal answers object cannot be modified
          filteredPrompt.choices = filteredPrompt.choices(props);
        };
        if (typeof filteredPrompt.default === 'function') {
          filteredPrompt.default = filteredPrompt.default(props);
        };
        const answers = await this.prompt(filteredPrompt);
        Object.assign(props, answers);
      }
    }
    resolve(props);
  });
};

function normalize(option){
  // TODO: accept other types

  if (typeof option === 'boolean') {
    return option;
  }

  if (typeof option === 'string'){
    let lc = option.toLowerCase();

    if (lc === 'true' || lc === 'false') {
      // it's a Boolean in string format
      return (lc === 'true');
    } else if (!isNaN(lc)) {
      // it's a number in string format
      return Number(lc);
    } else {
      return option;
    }
  }
}

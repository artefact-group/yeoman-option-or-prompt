'use strict';

var q = require('q');

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
      // Options supplied, add to props
      props[prompt.name] = normalize(option); 
    }
  }, this);

  if (filteredPrompts.length) {
    return promptNotSuppliedOptions(filteredPrompts, props);
  }

  // No prompting required call the callback right away.
  return Promise.resolve(props);
};

function normalize(option){
    // TODO: 
    // accept other types
    
    if (typeof option === 'boolean') {
      return option;
    }

    if (typeof option === 'string'){
      let lc = option.toLowerCase();

      // it's a boolean in string format
      if (lc === 'true' || lc === 'false') {
        return (lc === 'true');
      } else {
        return option;
      }
    }
}

function promptNotSuppliedOptions(filteredPrompts, props) {
    // The when functions that may be specified with a prompt should receive all the already given answers.
    // That's why we have to do this overcomplex looking approach with promise (to make sure every when function
    // gets the latest answers given).
    var prompts = filteredPrompts.map(function(filteredPrompt) {
      return function() {
        var promise = q.defer();

        var isWhenConditionFulfilled = typeof filteredPrompt.when !== 'function' ||
            (typeof filteredPrompt.when === 'function' && filteredPrompt.when(props));

        if (isWhenConditionFulfilled) {
          delete filteredPrompt.when;

          this.prompt(filteredPrompt, function(mergeProps) {
              // Merge mergeProps into props/
              Object.assign(props, mergeProps);
              promise.resolve();
          });
        } else {
          promise.resolve();
        }
        return promise.promise;
      }.bind(this);
    }.bind(this));

    var currentPrompt = prompts[0]();
    for (var i = 1; i < prompts.length; i++) {
      currentPrompt = currentPrompt.then(prompts[i]);
    }
    return props;
}

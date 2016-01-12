'use strict'

var _ = require('lodash');
var q = require('q');

module.exports = function(prompts, callback) {
  // This method will only show prompts that haven't been supplied as options. This makes the generator more composable.
  var filteredPrompts = [];
  var props = {};

  prompts.forEach(function(prompt) {
    this.option(prompt.name);
    var option = this.options[prompt.name];

    if (option !== undefined) {
      // Options supplied, add to props
      props[prompt.name] = option;
    } else {
      // No option supplied, user will be prompted
      filteredPrompts.push(prompt);
    }
  }, this);

  if (filteredPrompts.length) {
    // Some options were not supplied, prompting required.
    promptNotSuppliedOptions.call(this, filteredPrompts, props, callback);
  } else {
    // No prompting required call the callback right away.
    callback && callback(props);
  }

  function promptNotSuppliedOptions(notSuppliedOptions, props, callback) {
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
            _.assign(props, mergeProps);
            promise.resolve();
          });
        }
        else {
          promise.resolve();
        }

        return promise.promise;
      }.bind(this);
    }.bind(this));

    var currentPrompt = prompts[0]();
    for (var i = 1; i < prompts.length; i++) {
      currentPrompt = currentPrompt.then(prompts[i]);
    }
    currentPrompt.then(function() { callback && callback(props); });
  }
}

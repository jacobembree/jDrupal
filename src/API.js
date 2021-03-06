/**
 * Implements hook_csrf_token_preprocess().
 */
function hook_csrf_token_preprocess(options) {
  try {
    // Add a timestamp to the token retrieval URL.
    options.token_url += '&time=' + time();
  }
  catch (error) {
    console.log('cw_tv_csrf_token_preprocess - ' + error);
  }
}

/**
 * Preprocess a service call.
 * @param {Object} options
 */
function hook_services_preprocess(options) {
  try {
    // Do stuff before the service call...
  }
  catch (error) { console.log('hook_services_preprocess - ' + error); }
}

/**
 * Postprocess a service call.
 * @param {Object} options
 * @param {Object} result
 */
function hook_services_postprocess(options, result) {
  try {
    // Do stuff after the service call...
  }
  catch (error) { console.log('hook_services_postprocess - ' + error); }
}

/**
 * Alter the result data of a service call, before its success function.
 * @param {object} options
 * @param {Object} result
 */
function hook_services_request_pre_postprocess_alter(options, result) {
  try {
    if (options.service == 'user' && options.resource == 'login') {
      result.user.extra_cool = true;
    }
  }
  catch (error) {
    console.log('hook_services_request_pre_postprocess_alter - ' + error);
  }
}

/**
 * Alter the result data of a service call, after its success function.
 * @param {object} options
 * @param {Object} result
 */
function hook_services_request_postprocess_alter(options, result) {
  try {
    if (options.service == 'user' && options.resource == 'login') {
      jDrupal.user.extra_cool = false;
    }
  }
  catch (error) {
    console.log('hook_services_request_postprocess_alter - ' + error);
  }
}


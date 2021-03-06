/**
 * Creates an entity.
 * @param {String} entity_type
 * @param {String} bundle
 * @param {Object} entity
 * @param {Object} options
 */
function entity_create(entity_type, bundle, entity, options) {
  try {
    var path = entity_type + '.json';
    if (in_array(entity_type, services_entity_types())) { path = 'entity_' + path; }
    jDrupal.services.call({
        method: 'POST',
        async: options.async,
        path: path,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        bundle: bundle,
        data: JSON.stringify(entity),
        success: function(data) {
          try {
            if (options.success) { options.success(data); }
          }
          catch (error) { console.log('entity_create - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_create - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_create - ' + error); }
}

/**
 * Retrieves an entity.
 * @param {String} entity_type
 * @param {Number} ids
 * @param {Object} options
 */
function entity_retrieve(entity_type, ids, options) {
  try {
    var path = entity_type + '/' + ids + '.json';
    if (in_array(entity_type, services_entity_types())) { path = 'entity_' + path; }
    jDrupal.services.call({
        method: 'GET',
        path: path,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        entity_id: ids,
        success: function(data) {
          try {
            if (options.success) { options.success(data); }
          }
          catch (error) { console.log('entity_retrieve - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_retrieve - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_retrieve - ' + error); }
}

/**
 * Updates an entity.
 * @param {String} entity_type
 * @param {String} bundle
 * @param {Object} entity
 * @param {Object} options
 */
function entity_update(entity_type, bundle, entity, options) {
  try {
    var primary_key = entity_primary_key(entity_type);
    var path = entity_type + '/' + entity[primary_key] + '.json';
    if (in_array(entity_type, services_entity_types())) {
      path = 'entity_' + path;
      data = entity;
    }
    else { data = _entity_wrap(entity_type, entity); }
    jDrupal.services.call({
        method: 'PUT',
        path: path,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        entity_id: entity[entity_primary_key(entity_type)],
        bundle: bundle,
        data: JSON.stringify(data),
        success: function(result) {
          try {
            _entity_local_storage_delete(entity_type, entity[primary_key]);
            if (options.success) { options.success(result); }
          }
          catch (error) { console.log('entity_update - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_update - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_update - ' + error); }
}

/**
 * Deletes an entity.
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Object} options
 */
function entity_delete(entity_type, entity_id, options) {
  try {
    var path = entity_type + '/' + entity_id + '.json';
    if (in_array(entity_type, services_entity_types())) { path = 'entity_' + path; }
    jDrupal.services.call({
        method: 'DELETE',
        path: path,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        entity_id: entity_id,
        success: function(data) {
          try {
            _entity_local_storage_delete(entity_type, entity_id);
            if (options.success) { options.success(data); }
          }
          catch (error) { console.log('entity_delete - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_delete - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_delete - ' + error); }
}

/**
 * Performs an entity index.
 * @param {String} entity_type
 * @param {String} query
 * @param {Object} options
 */
function entity_index(entity_type, query, options) {
  try {

    // Build the query string and path to the index resource.
    var query_string;
    if (typeof query === 'object') {
      query_string = entity_index_build_query_string(query);
    }
    else if (typeof query === 'string') {
      query_string = query;
    }
    if (query_string) { query_string = '&' + query_string; }
    else { query_string = ''; }
    var path = entity_type + '.json' + query_string;
    if (in_array(entity_type, services_entity_types())) { path = 'entity_' + path; }

    // If entity caching is enabled, try to load the index results from local
    // storage and return them instead.
    var caching_enabled = entity_caching_enabled(entity_type);
    if (caching_enabled) {
      var result = _entity_index_local_storage_load(entity_type, path, {});
      if (result && options.success) {
        options.success(result);
        return;
      }
    }

    // Ask Drupal for an index on the entity(ies). Attach the query to the
    // options object so pre/post process hook implementations can have access
    // to it.
    jDrupal.services.call({
        method: 'GET',
        path: path,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        query: query,
        success: function(result) {
          try {
            if (options.success) {

              // If entity caching is enabled and we fully loaded the entities,
              // iterate over each entity and save them to local storage, then
              // set aside this index path so the same query can easily be
              // reloaded later.
              if (
                caching_enabled &&
                query.options &&
                query.options.entity_load
              ) {
                for (var i = 0; i < result.length; i++) {
                  var entity = result[i];
                  _entity_set_expiration_time(entity);
                  _entity_local_storage_save(
                    entity_type,
                    result[i][entity_primary_key(entity_type)],
                    entity
                  );
                }
                _entity_index_local_storage_save(entity_type, path, result);
              }

              // Send along the results.
              options.success(result);
            }
          }
          catch (error) { console.log('entity_index - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_index - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_index - ' + error); }
}
/**
 * Builds a query string from a query object for an entity index resource.
 * @param {Object} query
 * @return {String}
 */
function entity_index_build_query_string(query) {
  try {
    var result = '';
    if (!query) { return result; }
    if (query.fields) { // array
      var fields = '';
      for (var i = 0; i < query.fields.length; i++) {
        fields += encodeURIComponent(query.fields[i]) + ',';
      }
      if (fields != '') {
        fields = 'fields=' + fields.substring(0, fields.length - 1);
        result += fields + '&';
      }
    }
    if (query.parameters) { // object
      var parameters = '';
      for (var parameter in query.parameters) {
          if (query.parameters.hasOwnProperty(parameter)) {
            var key = encodeURIComponent(parameter);
            var value = encodeURIComponent(query.parameters[parameter]);
            parameters += 'parameters[' + key + ']=' + value + '&';
          }
      }
      if (parameters != '') {
        parameters = parameters.substring(0, parameters.length - 1);
        result += parameters + '&';
      }
    }
    if (query.parameters_op) { // object
      var parameters_op = '';
      for (var parameter_op in query.parameters_op) {
          if (query.parameters_op.hasOwnProperty(parameter_op)) {
            var key = encodeURIComponent(parameter_op);
            var value = encodeURIComponent(query.parameters_op[parameter_op]);
            // @TODO remove double compatability upon resolution of #2537968 on
            // drupal.org
            parameters_op += 'parameters_op[' + key + ']=' + value + '&';
            parameters_op +=
              'options[parameters_op][' + key + ']=' + value + '&';
          }
      }
      if (parameters_op != '') {
        parameters_op = parameters_op.substring(0, parameters_op.length - 1);
        result += parameters_op + '&';
      }
    }
    if (query.orderby) {
      var orderby = '';
      for (var column in query.orderby) {
          if (!query.orderby.hasOwnProperty(column)) { continue; }
          var key = encodeURIComponent(column);
          var value = encodeURIComponent(query.orderby[column]);
          // @TODO remove double compatability upon resolution of #2537968 on
          // drupal.org
          orderby += 'orderby[' + key + ']=' + value + '&';
          orderby += 'options[orderby][' + key + ']=' + value + '&';
      }
      if (orderby != '') {
        orderby = orderby.substring(0, orderby.length - 1);
        result += orderby + '&';
      }
    }
    if (query.options) {
      var options = '';
      for (var option in query.options) {
          if (!query.options.hasOwnProperty(option)) { continue; }
          var _option = query.options[option];
          if (typeof _option === 'object') {
            for (var column in _option) {
              if (!_option.hasOwnProperty(column)) { continue; }
              var key = encodeURIComponent(column);
              var value = encodeURIComponent(_option[column]);
              options += 'options[' + option + '][' + key + ']=' + value + '&';
            }
          }
          else {
            var value = encodeURIComponent(_option);
            options += 'options[' + option + ']=' + value + '&';
          }
      }
      if (options != '') {
        options = options.substring(0, options.length - 1);
        result += options + '&';
      }
    }
    if (typeof query.page !== 'undefined') { // int
      result += 'page=' + encodeURIComponent(query.page) + '&';
    }
    if (typeof query.page_size !== 'undefined') { // int
      var msg =
        'WARNING query.page_size is deprecated, use query.pagesize instead!';
      console.log(msg);
      result += 'pagesize=' + encodeURIComponent(query.page_size) + '&';
    }
    else if (typeof query.pagesize !== 'undefined') { // int
      result += 'pagesize=' + encodeURIComponent(query.pagesize) + '&';
    }
    return result.substring(0, result.length - 1);
  }
  catch (error) { console.log('entity_index_build_query_string - ' + error); }
}

/**
 * Wraps an entity in a JSON object, keyed by its type.
 * @param {String} entity_type
 * @param {Object} entity
 * @return {String}
 */
function _entity_wrap(entity_type, entity) {
  try {
    // We don't wrap comments, taxonomy, users or commerce entities.
    var entity_wrapper = {};
    if (entity_type == 'comment' || entity_type == 'taxonomy_term' ||
      entity_type == 'taxonomy_vocabulary' ||
      entity_type == 'user' || entity_type.indexOf('commerce') != -1) {
      entity_wrapper = entity;
    }
    else { entity_wrapper[entity_type] = entity; }
    return entity_wrapper;
  }
  catch (error) { console.log('_entity_wrap - ' + error); }
}


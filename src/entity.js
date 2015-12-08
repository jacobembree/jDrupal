/**
 * Entity
 * @param entityType
 * @param bundle
 * @param id
 * @constructor
 */
jDrupal.Entity = function(entityType, bundle, id) {

  this.entity = null;

  // @TODO these flat values need to be turned into arrays, e.g.
  // [ { value: 'foo'} ]
  this.bundle = bundle;
  this.entityID = id;

  this.entityKeys = {};
};

jDrupal.Entity.prototype.getEntityKey = function(key) {
  return typeof this.entityKeys[key] !== 'undefined' ?
    this.entityKeys[key] : null;
};
jDrupal.Entity.prototype.getEntityType = function() {
  return this.entityKeys['type'];
};
jDrupal.Entity.prototype.getBundle = function() {
  var bundle = this.getEntityKey('bundle');
  return typeof this.entity[bundle] !== 'undefined' ?
    this.entity[bundle][0].target_id : null;
};
jDrupal.Entity.prototype.id = function() {
  var id = this.getEntityKey('id');
  return typeof this.entity[id] !== 'undefined' ?
    this.entity[id][0].value : null;
};
jDrupal.Entity.prototype.isNew = function() {
  return !this.id();
};

/**
 * ENTITY LOADING...
 */

/**
 * Entity load.
 * @param options
 */
jDrupal.Entity.prototype.load = function(options) {
  try {
    var _entity = this;
    var entityType = this.getEntityType();
    jDrupal.services.call({
      method: 'GET',
      path: entityType + '/' + this.id(),
      service: entityType,
      resource: 'retrieve',
      _format: 'json',
      success: function(data) {
        _entity.entity = data;
        if (options.success) { options.success(data); }
      },
      error: function(xhr, status, message) {
        if (options.error) { options.error(xhr, status, message); }
      }
    });

  }
  catch (error) {
    console.log('jDrupal.Entity.load - ' + error);
  }
};

/**
 * ENTITY SAVING...
 */

/**
 * Entity pre save.
 * @param options
 */
jDrupal.Entity.prototype.preSave = function(options) {
  options.success();
};

/**
 * Entity save.
 * @param options
 */
jDrupal.Entity.prototype.save = function(options) {

  // Set aside "this" entity.
  var _entity = this;

  // Invoke the pre-save.
  this.preSave({
    success: function() {

      try {

        var entityType = _entity.getEntityType();
        var method = null;
        var resource = null;
        var path = null;

        var isNew = _entity.isNew();

        // Save new entity.
        if (isNew) {

          method = 'POST';
          resource = 'create';
          path = 'entity/' + entityType;

        }

        // Update existing entity.
        else {

          method = 'PATCH';
          resource = 'update';
          path = entityType + '/' + _entity.id();

        }

        // Make the call...
        jDrupal.services.call({
          method: method,
          contentType: 'application/json',
          path: path,
          service: entityType,
          resource: resource,
          data: JSON.stringify(_entity.entity),
          _format: 'json',
          success: function(data) {

            _entity.postSave(data, {
              success: function() {

                //if (!isNew) {
                //  _entity_local_storage_delete(entityType, entity.id());
                //}

                // Move along..
                if (options.success) {
                  if (isNew) { options.success(data); } // 201 - Created
                  else { options.success(); } // 204 - No Content
                }

              }
            });

          },
          error: function(xhr, status, message) {
            if (options.error) { options.error(xhr, status, message); }
          }
        });

      }
      catch (error) {
        console.log('jDrupal.Entity.save - ' + error);
      }

    }
  });

};

/**
 * Entity post save.
 * @param data
 * @param options
 */
jDrupal.Entity.prototype.postSave = function(data, options) {
  // For new entities, set their id's value.
  if (this.isNew()) {
    var parts = data.split('/');
    var entityID =
      this.entity[this.getEntityKey('id')] = [ {
        value: parts[parts.length - 1]
      }];
  }
  options.success();
};

/**
 * ENTITY DELETING...
 */

/**
 * Entity pre delete.
 * @param options
 */
jDrupal.Entity.prototype.preDelete = function(options) {
  options.success();
};

/**
 * Entity delete.
 * @param options
 */
jDrupal.Entity.prototype.delete = function(options) {

  // Set aside "this" entity.
  var _entity = this;

  // Invoke the pre-delete.
  this.preDelete({
    success: function() {

      try {

        var entityType = _entity.getEntityType();

        // Build the necessary data to send along with the DELETE request.
        var data = {};
        data[_entity.getEntityKey('bundle')] = [ {
          target_id: _entity.getBundle()
        }];

        jDrupal.services.call({
          method: 'DELETE',
          contentType: 'application/json',
          path: entityType + '/' + _entity.id(),
          service: entityType,
          resource: 'delete',
          entity_type: entityType,
          bundle: _entity.getBundle(),
          data: JSON.stringify(data),
          _format: 'json',
          success: function() {

            //_entity_local_storage_delete(entity_type, entity_id);

            // Invoke the post-delete.
            _entity.postDelete({
              success: function() {

                // Move along...
                if (options.success) {
                  options.success(); // 204 - No Content
                }

              }
            });

          },
          error: function(xhr, status, message) {
            if (options.error) { options.error(xhr, status, message); }
          }
        });

      }
      catch (error) {
        console.log('jDrupal.Entity.delete - ' + error);
      }

    }
  });

};

/**
 * Entity post delete.
 * @param options
 */
jDrupal.Entity.prototype.postDelete = function(options) {
  // Clear out the entity and succeed.
  this.entity = null;
  options.success();
};

/**
 * HELPERS
 */

/**
 *
 * @param obj
 * @param entityID_or_entity
 */

// @TODO every function should live in the jDrupal namespace!
function jDrupalEntityConstructorPrep(obj, entityID_or_entity) {
  try {
    if (typeof entityID_or_entity === 'object') {
      obj.entity = entityID_or_entity;
    }
    else {
      var id = obj.getEntityKey('id');
      var entity = {};
      entity[id]= [ { value: entityID_or_entity } ];
      obj.entity = entity;
    }
  }
  catch (error) { console.log('jDrupalEntityConstructorPrep - ' + error); }
}









/**
 * Delete an entity.
 * @param {String} entity_type
 * @param {Number} ids
 * @param {Object} options
 */
function entity_delete(entity_type, ids, options) {
  try {
    var function_name = entity_type + '_delete';
    if (function_exists(function_name)) {
      var fn = window[function_name];
      fn(ids, options);
    }
    else {
      console.log('WARNING: entity_delete - unsupported type: ' + entity_type);
    }
  }
  catch (error) { console.log('entity_delete - ' + error); }
}

/**
 * Parses an entity id and returns it as an integer (not a string).
 * @param {*} entity_id
 * @return {Number}
 */
function entity_id_parse(entity_id) {
  try {
    var id = entity_id;
    if (typeof id === 'string') { id = parseInt(entity_id); }
    return id;
  }
  catch (error) { console.log('entity_id_parse - ' + error); }
}

/**
 * Given an entity type and the entity id, this will return the local storage
 * key to be used when saving/loading the entity from local storage.
 * @param {String} entity_type
 * @param {Number} id
 * @return {String}
 */
function entity_local_storage_key(entity_type, id) {
  try {
    return entity_type + '_' + id;
  }
  catch (error) { drupalgap_error(error); }
}

/**
 * Loads an entity.
 * @param {String} entity_type
 * @param {Number} ids
 * @param {Object} options
 */
function entity_load(entity_type, ids, options) {
  try {
    if (!is_int(ids)) {
      // @TODO - if an array of ints is sent in, call entity_index() instead.
      var msg = 'entity_load(' + entity_type + ') - only single ids supported!';
      console.log(msg);
      return;
    }
    var entity_id = ids;
    // Convert the id to an int, if it's a string.
    entity_id = entity_id_parse(entity_id);
    // If this entity is already queued for retrieval, set the success and
    // error callbacks aside, and return. Unless entity caching is enabled and
    // we have a copy of the entity in local storage, then send it to the
    // provided success callback.
    if (_services_queue_already_queued(
      entity_type,
      'retrieve',
      entity_id,
      'success'
    )) {
      if (jDrupal.settings.cache.entity.enabled) {
        entity = _entity_local_storage_load(entity_type, entity_id, options);
        if (entity) {
          if (options.success) { options.success(entity); }
          return;
        }
      }
      if (typeof options.success !== 'undefined') {
        _services_queue_callback_add(
          entity_type,
          'retrieve',
          entity_id,
          'success',
          options.success
        );
      }
      if (typeof options.error !== 'undefined') {
        _services_queue_callback_add(
          entity_type,
          'retrieve',
          entity_id,
          'error',
          options.error
        );
      }
      return;
    }

    // This entity has not been queued for retrieval, queue it and its callback.
    _services_queue_add_to_queue(entity_type, 'retrieve', entity_id);
    _services_queue_callback_add(
      entity_type,
      'retrieve',
      entity_id,
      'success',
      options.success
    );

    // If entity caching is enabled, try to load the entity from local storage.
    // If a copy is available in local storage, send it to the success callback.
    var entity = false;
    if (jDrupal.settings.cache.entity.enabled) {
      entity = _entity_local_storage_load(entity_type, entity_id, options);
      if (entity) {
        if (options.success) { options.success(entity); }
        return;
      }
    }

    // Verify the entity type is supported.
    if (!in_array(entity_type, entity_types())) {
      var message = 'WARNING: entity_load - unsupported type: ' + entity_type;
      console.log(message);
      if (options.error) { options.error(null, null, message); }
      return;
    }

    // We didn't load the entity from local storage. Let's grab it from the
    // Drupal server instead. First, let's build the call options.
    var primary_key = entity_primary_key(entity_type);
    var call_options = {
      success: function(data) {
        try {
          // Set the entity equal to the returned data.
          entity = data;
          // Is entity caching enabled?
          if (jDrupal.settings.cache.entity &&
              jDrupal.settings.cache.entity.enabled) {
            // Set the expiration time as a property on the entity that can be
            // used later.
            if (jDrupal.settings.cache.entity.expiration !== 'undefined') {
              var expiration = time() + jDrupal.settings.cache.entity.expiration;
              if (jDrupal.settings.cache.entity.expiration == 0) {
                expiration = 0;
              }
              entity.expiration = expiration;
            }
            // Save the entity to local storage.
            _entity_local_storage_save(entity_type, entity_id, entity);
          }
          // Send the entity back to the queued callback(s).
          var _success_callbacks =
            jDrupal.services_queue[entity_type]['retrieve'][entity_id].success;
          for (var i = 0; i < _success_callbacks.length; i++) {
            _success_callbacks[i](entity);
          }
          // Clear out the success callbacks.
          jDrupal.services_queue[entity_type]['retrieve'][entity_id].success =
            [];
        }
        catch (error) {
          console.log('entity_load - success - ' + error);
        }
      },
      error: function(xhr, status, message) {
        try {
          if (options.error) { options.error(xhr, status, message); }
        }
        catch (error) {
          console.log('entity_load - error - ' + error);
        }
      }
    };

    // Finally, determine the entity's retrieve function and call it.
    var function_name = entity_type + '_retrieve';
    if (function_exists(function_name)) {
      call_options[primary_key] = entity_id;
      var fn = window[function_name];
      fn(ids, call_options);
    }
    else {
      console.log('WARNING: ' + function_name + '() does not exist!');
    }
  }
  catch (error) { console.log('entity_load - ' + error); }
}

/**
 * An internal function used by entity_load() to attempt loading an entity
 * from local storage.
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Object} options
 * @return {Object}
 */
function _entity_local_storage_load(entity_type, entity_id, options) {
  try {
    var entity = false;
    // Process options if necessary.
    if (options) {
      // If we are resetting, remove the item from localStorage.
      if (options.reset) {
        _entity_local_storage_delete(entity_type, entity_id);
      }
    }
    // Attempt to load the entity from local storage.
    var local_storage_key = entity_local_storage_key(entity_type, entity_id);
    entity = window.localStorage.getItem(local_storage_key);
    if (entity) {
      entity = JSON.parse(entity);
      // We successfully loaded the entity from local storage. If it expired
      // remove it from local storage then continue onward with the entity
      // retrieval from jDrupal. Otherwise return the local storage entity copy.
      if (typeof entity.expiration !== 'undefined' &&
          entity.expiration != 0 &&
          time() > entity.expiration) {
        _entity_local_storage_delete(entity_type, entity_id);
        entity = false;
      }
      else {
      }
    }
    return entity;
  }
  catch (error) { console.log('_entity_load_from_local_storage - ' + error); }
}

/**
 * An internal function used to save an entity to local storage.
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Object} entity
 */
function _entity_local_storage_save(entity_type, entity_id, entity) {
  try {
    window.localStorage.setItem(
      entity_local_storage_key(entity_type, entity_id),
      JSON.stringify(entity)
    );
  }
  catch (error) { console.log('_entity_local_storage_save - ' + error); }
}

/**
 * An internal function used to delete an entity from local storage.
 * @param {String} entity_type
 * @param {Number} entity_id
 */
function _entity_local_storage_delete(entity_type, entity_id) {
  try {
    var storage_key = entity_local_storage_key(
      entity_type,
      entity_id
    );
    window.localStorage.removeItem(storage_key);
  }
  catch (error) { console.log('_entity_local_storage_delete - ' + error); }
}

/**
 * Returns an entity type's primary key.
 * @param {String} entity_type
 * @return {String}
 */
function entity_primary_key(entity_type) {
  try {
    var key;
    switch (entity_type) {
      case 'comment': key = 'cid'; break;
      case 'file': key = 'fid'; break;
      case 'node': key = 'nid'; break;
      case 'taxonomy_term': key = 'tid'; break;
      case 'taxonomy_vocabulary': key = 'vid'; break;
      case 'user': key = 'uid'; break;
      default:
        // Is anyone declaring the primary key for this entity type?
        var function_name = entity_type + '_primary_key';
        if (drupalgap_function_exists(function_name)) {
          var fn = window[function_name];
          key = fn(entity_type);
        }
        else {
          var msg = 'entity_primary_key - unsupported entity type (' +
            entity_type + ') - to add support, declare ' + function_name +
            '() and have it return the primary key column name as a string';
          console.log(msg);
        }
        break;
    }
    return key;
  }
  catch (error) { console.log('entity_primary_key - ' + error); }
}

/**
 * Saves an entity.
 * @param {String} entity_type
 * @param {String} bundle
 * @param {Object} entity
 * @param {Object} options
 */
function entity_save(entity_type, bundle, entity, options) {
  try {
    var function_name;
    switch (entity_type) {
      case 'comment':
        if (!entity.cid) { function_name = 'comment_create'; }
        else { function_name = 'comment_update'; }
        break;
      case 'file':
        function_name = 'file_create';
        break;
      case 'node':
        if (!entity.langcode) {
          entity.langcode = [{ value: language_default() }];
        }
        if (!entity.id()) { function_name = 'node_create'; }
        else { function_name = 'node_update'; }
        break;
      case 'user':
        if (!entity.id()) { function_name = 'user_create'; }
        else { function_name = 'user_update'; }
        break;
      case 'taxonomy_term':
        if (!entity.tid) { function_name = 'taxonomy_term_create'; }
        else { function_name = 'taxonomy_term_update'; }
        break;
      case 'taxonomy_vocabulary':
        if (!entity.vid) { function_name = 'taxonomy_vocabulary_create'; }
        else { function_name = 'taxonomy_vocabulary_update'; }
        break;
    }
    if (function_name && function_exists(function_name)) {
      var fn = window[function_name];
      fn(entity, options);
    }
    else {
      console.log('WARNING: entity_save - unsupported type: ' + entity_type);
    }
  }
  catch (error) { console.log('entity_save - ' + error); }
}

/**
 * Returns an array of entity type names.
 * @return {Array}
 */
function entity_types() {
  try {
    return [
      'comment',
      'file',
      'node',
      'taxonomy_term',
      'taxonomy_vocabulary',
      'user'
    ];
  }
  catch (error) { console.log('entity_types - ' + error); }
}

/**
 * Given a Location header for an entity from a 201 response, this will return
 * the entity id.
 * @param {String} location
 * @return {Number}
 */
function entity_id_from_location(location) {
  try {
    return location.split('/').pop();
  }
  catch (error) { console.log('entity_id_from_location - ' + error); }
}


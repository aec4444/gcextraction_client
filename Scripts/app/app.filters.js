app.filter('byPropertyValue', function () {
  function getProperty(obj, prop) {
    var parts = prop.split('.');

    if (Array.isArray(parts) && parts.length > 1) {
      var last = parts.pop(),
      l = parts.length,
      i = 1,
      current = parts[0];

      while ((obj = obj[current]) && i < l) {
        current = parts[i];
        i++;
      }

      if (obj) {
        return obj[last];
      }
    } else {
      return obj[prop];
    }
  }

  return function(input, propertyName, propertyValue) {
    if (propertyName === undefined)
      propertyName = "name";

    var i = 0, len = input.length;
    var result = [];
    var isArray = angular.isArray(propertyValue);

    for (; i < len; i++) {
      var getPropertyValue = getProperty(input[i], propertyName);

      if ((!isArray && getPropertyValue == propertyValue) || (isArray && propertyValue.indexOf(getPropertyValue) >= 0))
        result.push(input[i]);
    }
    return result;
  }
});

app.filter('findById', function () {
  return function (input, id, idName) {
    if (idName === undefined)
      idName = "id";

    var i = 0, len = input.length;
    for (; i < len; i++) {
      if (+input[i][idName] === +id) {
        return input[i];
      }
    }
    return null;
  }
});
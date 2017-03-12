(function() {
  angular
    .module("GameChangerExtraction")
    //.config(exceptionProviderConfig)
    .factory("$globals", globalsFactory)
    .factory("$gameChanger", gameChangerFactory)
    .factory("$calcs", calculationsFactory);

  function globalsFactory() {
    var defaultKeys = {
      teamId: '58ba33b6b1ec06c89e000001',
      name: "nj-pride-12u",
      season: "fall-2016",
      displayName: "NJ Pride 12u"
    };

    var teamKeys = {};
    teamKeys["12"] = defaultKeys;
    teamKeys["FALL12"] = {
      teamId: '57da99dbbb36b30023bc460f',
      name: "nj-pride-12u-weir",
      season: "spring-2017",
      displayName: "NJ Pride 12u"
    };
    teamKeys["14DEAN"] = {teamId: "57dc39004e2701942a000683", name: "nj-pride-14u-dean", season: "fall-2016", displayName: "NJ Pride 14u-Dean"};
    teamKeys["JG10OLD"] = {teamId: "57d3f2de1797216e3d000001", name: "jersey-girls-jersey-girls-10u", season: "fall-2016", displayName: "Jersey Girls 10u - Old"}
    teamKeys["JG10"] = {teamId: "57d15e58bb36b300236a34de", name: "jersey-girls-10u", season: "fall-2016", displayName: "Jersey Girls 10u"}

    return {
      defaultTeam: "12",
      teamKeys: teamKeys,
      statsUrl: "http://gamechanger-aec4444.rhcloud.com",
      //statsUrl: "http://localhost:8081",
      getKeys: function(team) {
        var keys = teamKeys[team];
        return keys || defaultKeys;
      }
    }
  }

  gameChangerFactory.$inject = ['$http', '$globals'];
  function gameChangerFactory($http, $globals) {
    var getRoster = function (keys, success) {
      // build the url to get the schedule.  You have to get it from a page, there isn't a rest service.  
      var url = $globals.statsUrl + "/roster";

      return $http.get(url, {
        params: {
          season: keys.season,
          name: keys.name,
          id: keys.teamId
        }
      }).then(function (response) {
        success(response.data);
      });
    };

    var getSchedule = function (keys, success) {
      // build the url to get the schedule.  You have to get it from a page, there isn't a rest service.  
      var url = $globals.statsUrl + "/schedule";

      return $http.get(url, {
        params: {
          season: keys.season,
          name: keys.name,
          id: keys.teamId
        }
      }).then(function (response) {
        success(response.data);
      });
    };

    var getStats = function (keys, games, success) {
      // build the url to get the schedule.  You have to get it from a page, there isn't a rest service.  
      var url = $globals.statsUrl + "/stats";

      // use the games array to get a list of game IDs
      var ids = [];
      angular.forEach(games, function(game) {
        ids.push(game.id);
      });

      return $http({
        url: url,
        method: "GET",
        params: {
          season: keys.season,
          name: keys.name,
          id: keys.teamId,
          games: ids
        },
        headers: {
          'Content-Type': undefined
        }
      }).then(function (response) {
        success(response.data);
      });
    }

    return {
      getRoster: getRoster,
      getSchedule: getSchedule,
      getStats: getStats
    }
  }

  function getOPS(AB, H, Double, Triple, HR, BB, HBP) {
    return getSlg(AB, H, Double, Triple, HR) + getOBP(AB, H, BB, HBP);
  }

  function getOBP(AB, H, BB, HBP) {
    return (H + BB + HBP) / ((AB + BB + HBP) || 1);
  }

  function getSLG(AB, H, Double, Triple, HR) {
    if (AB === undefined || AB === 0)
      return 0;
    else
      return (H + Double + (Triple * 2) + (HR * 3)) / AB;
  }

  function getRC(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var a = H + BB + HBP - CS;
    var tb = (H + Double + Triple * 2 + HR * 3);
    var b = tb + (0.26 * (BB + HBP)) + (0.53 * SAC) + (0.64 * SB) - (0.03 * (K || 0));
    var c = PA;

    var rc = ((a + 2.4 * c) * (b + 3 * c)) / (9 * c) - (0.9 * c);
    return rc || 0;
  };

  function getXR(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var singles = H - Double - Triple - HR;
    var result = (0.5 * singles) + (0.72 * Double) + (1.04 * Triple) + (1.44 * HR) + (0.34 * (HBP + BB)) + (0.18 * SB) + (-0.32 * CS) + (-0.09 * (AB - H - K)) + (-0.098 * K) + (0.04 * SAC);
    return result || 0; 
  }

  function getRC21(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var rc = getRC(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K);
    var d = (AB - H + CS + SAC);
    var result = rc / d * 21;

    return result || 0;
  }

  function getXR21(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K) {
    var xr = getXR(AB, H, BB, CS, HBP, Double, Triple, HR, SAC, SB, PA, K);
    var d = (AB - H + CS + SAC);
    var result = xr / d * 21;

    return result || 0;
  }

  function getAvg(agg, n, d, format) {

  }

  function calculationsFactory() {
    return {
      RC: getRC,
      XR: getXR,
      RC21: getRC21,
      XR21: getXR21,
      Avg: getAvg,
      OBP: getOBP,
      SLG: getSLG, 
      OPS: getOPS
    }
  }
})();
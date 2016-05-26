app.controller('GameChangerScheduleController', [
  '$scope', '$gameChanger', '$stateParams', "$globals", "$filter",
  function ($scope, $gameChanger, $stateParams, $globals, $filter) {
    var vm = this;
    var clearData = {
      pitchData: [],
      countData: [],
      outData: [],
      runnersData: [],
      distData: [],
      fieldData: []
    };

    vm.data = angular.copy(clearData);

    var team = $stateParams.team;
    vm.name = $globals.getKeys(team).displayName;

    var sumValuesPrimitive = function(itemList, key, totalKey) {
      if (!angular.isArray(itemList)) {
        itemList = [itemList];
      }

      if (!angular.isArray(key))
        key = [key];

      if (totalKey === undefined)
        totalKey = "total";

      angular.forEach(itemList, function (item) {
        for (var i = 0; i < key.length; i++) {
          var currentKey = key[i];

          item[totalKey] = (item[totalKey] === undefined ? 0 : item[totalKey]) + item[currentKey];
        }
      });
    };

    var sumValues = function (itemList, key, totalKey) {
      if (!angular.isArray(itemList)) {
        itemList = [itemList];
      }

      if (totalKey === undefined)
        totalKey = "total";

      angular.forEach(itemList, function(item) {
        if (item[totalKey] === undefined)
          item[totalKey] = {};

        if (!angular.isArray(key))
          key = [key];

        for (var i = 0; i < key.length; i++) {
          var currentKey = key[i];

          for (var k in item[currentKey]) {
            if (item[currentKey].hasOwnProperty(k) && k !== "playerId" && k !== "player" && k !== "outs" && k !== "strikes" && k !== "balls") {
              item[totalKey][k] = (item[totalKey][k] === undefined ? 0 : item[totalKey][k]) + item[currentKey][k];
            }
          }
        }
      });

    }

    var sumByKeys = function (values, enumKeys, prefix, totalKey) {
      if (totalKey === undefined)
        totalKey = "total";

      angular.forEach(values, function (item) {
        item[totalKey] = {};

        angular.forEach(enumKeys, function (key) {
          item[key].PA = (item[key].AB + item[key].BB + item[key].HBP);
          item[key].OnBase = item[key].H + item[key].BB + item[key].HBP;

          sumValues(item, key, totalKey);

          item[key].AVG = item[key].AB === 0 ? 0 : item[key].H / item[key].AB;
          item[key].OBP = item[key].PA === 0 ? 0 : item[key].OnBase / item[key].PA;

          if (prefix !== undefined && prefix !== null)
            item[prefix + key] = item[key];
        });

        item[totalKey].AVG = item[totalKey].AB === 0 ? 0 : item[totalKey].H / item[totalKey].AB;
        item[totalKey].OBP = item[totalKey].PA === 0 ? 0 : item[totalKey].OnBase / item[totalKey].PA;

      });
    }

    vm.refreshData = function () {
      // build the array of included items.
      var ds = vm.optionsScheduleGrid.gridObject.dataSource;
      vm.selectedGames = [];

      for (var i = 0; i < ds.data().length; i++) {
        var ditem = ds.at(i);
        var game = $filter("byPropertyValue")(vm.schedule, "id", ditem.id);
        if (game !== undefined && game !== null && game.length > 0) {
          game[0].include = ditem.include;
        }
      }

      refreshData();
    };

    vm.gameSelection = {
      league: true,
      nonLeague: true,
      exhibition: false,
      postSeason: true
    };
    $scope.$watch("vm.gameSelection", function() {
      // set checkboxes appropriately if set
      if (vm.optionsScheduleGrid !== undefined && vm.optionsScheduleGrid.gridObject !== undefined) {
        var ds = vm.optionsScheduleGrid.gridObject.dataSource;

        for (var i = 0; i < ds.data().length; i++) {
          var ditem = ds.at(i);
          switch (ditem.type) {
            case "Exhibition":
              ditem.include = vm.gameSelection.exhibition;
              break;
            case "League":
              ditem.include = vm.gameSelection.league;
              break;
            case "Postseason":
              ditem.include = vm.gameSelection.postSeason;
              break;
            case "Non-League":
              ditem.include = vm.gameSelection.nonLeague;
              break;
          }
        }
      }
    }, true);

    vm.optionsScheduleGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "include", template: '<input ng-model="dataItem.include" type="checkbox"></input>', title: "Include", attributes: { "class": "text-center col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "play_time", template: "#= kendo.toString(kendo.parseDate(play_time), 'MM/dd/yyyy h:mm tt') #", title: "Start Time", attributes: { "class": "text-right col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "location", title: "Location", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "other_team_name", title: "Opponent", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "type", title: "Type", attributes: { "class": "col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "result", title: "Result", template: "#=result# (#= home ? state.home + '-' + state.away : state.away + '-' + state.home #)", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "wl", title: "Record (Tournaments)", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } }
      ],
      excel: {
        allPages: true,
        fileName: "schedule.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "play_time", dir: "desc" }
        ],
        transport: {
          read: function (e) {
            e.success(vm.schedule);
          }
        }
      })
    };

    vm.optionsPitchesSeenGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "pa", title: "PA", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "pitches", title: "Pitches", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "pitchesPerPa", format: "{0:n3}", title: "Pitches / PA", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "strikesLooking", title: "Strikes / L", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "strikesSwinging", title: "Strikes / S", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "fouls", title: "Fouls", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "balls", title: "Balls", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "inPlay", title: "In Play", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } }
      ],
      excel: {
        allPages: true,
        fileName: "pitches.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        transport: {
          sort: [
            { field: "player.num", dir: "asc" }
          ],
          read: function (e) {
            e.success(vm.data.pitchData);
          }
        }
      })
    };

    vm.optionsOutsGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "outs0.AVG", title: "AVG (0 Outs)", template: "#= kendo.toString(outs0.AVG, 'n3')# (#= outs0.H#-#= outs0.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "outs0.OBP", title: "OBP (0 Outs)", template: "#= kendo.toString(outs0.OBP, 'n3')# (#= outs0.OnBase#-#= outs0.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "outs1.AVG", title: "AVG (1 Outs)", template: "#= kendo.toString(outs1.AVG, 'n3')# (#= outs1.H#-#= outs1.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "outs1.OBP", title: "OBP (1 Outs)", template: "#= kendo.toString(outs1.OBP, 'n3')# (#= outs1.OnBase#-#= outs1.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "outs2.AVG", title: "AVG (2 Outs)", template: "#= kendo.toString(outs2.AVG, 'n3')# (#= outs2.H#-#= outs2.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "outs2.OBP", title: "OBP (2 Outs)", template: "#= kendo.toString(outs2.OBP, 'n3')# (#= outs2.OnBase#-#= outs2.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "total.AVG", title: "AVG (Total)", template: "#= kendo.toString(total.AVG, 'n3')# (#= total.H#-#= total.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "total.OBP", title: "OBP (Total)", template: "#= kendo.toString(total.OBP, 'n3')# (#= total.OnBase#-#= total.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } }
      ],
      excel: {
        allPages: true,
        fileName: "outhitting.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "player.num", dir: "asc" }
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.outsData);
          }
        }
      })
    };

    vm.optionsRunnersGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "empty.AVG", title: "AVG (Empty)", template: "#= kendo.toString(empty.AVG, 'n3')# (#= empty.H#-#= empty.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "empty.OBP", title: "OBP (Empty)", template: "#= kendo.toString(empty.OBP, 'n3')# (#= empty.OnBase#-#= empty.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "onbase.AVG", title: "AVG (On Base)", template: "#= kendo.toString(onbase.AVG, 'n3')# (#= onbase.H#-#= onbase.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "onbase.OBP", title: "OBP (On Base)", template: "#= kendo.toString(onbase.OBP, 'n3')# (#= onbase.OnBase#-#= onbase.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "scoring.AVG", title: "AVG (Scoring Pos)", template: "#= kendo.toString(scoring.AVG, 'n3')# (#= scoring.H#-#= scoring.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "scoring.OBP", title: "OBP (Scoring Pos)", template: "#= kendo.toString(scoring.OBP, 'n3')# (#= scoring.OnBase#-#= scoring.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "total.AVG", title: "AVG (Total)", template: "#= kendo.toString(total.AVG, 'n3')# (#= total.H#-#= total.AB#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "total.OBP", title: "OBP (Total)", template: "#= kendo.toString(total.OBP, 'n3')# (#= total.OnBase#-#= total.PA#)", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } }
      ],
      excel: {
        allPages: true,
        fileName: "runnerhitting.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "player.num", dir: "asc" }
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.runnersData);
          }
        }
      })
    };

    vm.optionsDistGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "if", title: "Infield", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "of", title: "Outfield", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "left", title: "Left Side", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "middle", title: "Middle", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "right", title: "Right Side", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "total", title: "Total", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } }
      ],
      excel: {
        allPages: true,
        fileName: "distribution.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "player.num", dir: "asc" }
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.distData);
          }
        }
      })
    };

    vm.optionsFieldGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "col-xs-2" }, headerAttributes: { "class": "col-xs-2" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "P.games", title: "P", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "C.games", title: "C", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "field1B.games", title: "1B", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "field2B.games", title: "2B", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "field3B.games", title: "3B", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "SS.games", title: "SS", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "LF.games", title: "LF", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "CF.games", title: "CF", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "RF.games", title: "RF", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "SF.games", title: "SF", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } },
        { field: "total.games", title: "Total", attributes: { "class": "text-right col-xs-1" }, headerAttributes: { "class": "col-xs-1" } }
      ],
      excel: {
        allPages: true,
        fileName: "fielding.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "player.num", dir: "asc" }
        ],
        transport: {
          read: function(e) {
            e.success(vm.data.fieldData);
          }
        }
      })
    };

    angular.forEach(vm.optionsFieldGrid.columns, function (col, i) {
      var fieldKey = col.field.substr(0, col.field.length - 6);

      if (i >= 2)
        col.template = "#= " + fieldKey + ".start # / #= " + col.field + "# (#= kendo.toString(" + fieldKey + ".innings, 'n1')#)";
    });

    vm.optionsStatsGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" }, headerAttributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" }, headerAttributes: { "class": "jersey-cell" } },
        { field: "stats.GP", title: "GP", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.PA", title: "PA", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.AB", title: "AB", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.R", title: "R", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.H", title: "H", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.Double", title: "2B", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.Triple", title: "3B", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.HR", title: "HR", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.RBI", title: "RBI", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.BB", title: "BB", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.HBP", title: "HBP", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.SO", title: "K / KL", template: "#= stats.SO# / #= stats.SOL#", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.SB", title: "SB", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.CS", title: "CS", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.LOB", title: "LOB", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.SAC", title: "SAC", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.ROE", title: "ROE", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.AVG", format: "{0:n3}", title: "AVG", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.OBP", format: "{0:n3}", title: "OBP", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.SLG", format: "{0:n3}", title: "SLG", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.OPS", format: "{0:n3}", title: "OPS", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.AVGRISP", format: "{0:n3}", title: "AVG-RISP", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "stats.QABPCT", format: "{0:p2}", title: "QAB%", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } }
      ],
      excel: {
        allPages: true,
        fileName: "fielding.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "stats.AVG", dir: "desc" }
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.statsData);
          }
        }
      })
    };

    vm.optionsPitchStatsGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" }, headerAttributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" }, headerAttributes: { "class": "jersey-cell" } },
        { field: "stats.GP", title: "GP", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.IP", format: "{0:n1}", title: "IP", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.GS", title: "GS", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.W", title: "W", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.L", title: "L", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.H", title: "H", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.R", title: "R", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.ER", title: "ER", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.BB", title: "BB", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.SO", title: "K", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.ERA", format: "{0:n2}", title: "ERA", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.WHIP", format: "{0:n3}", title: "WHIP", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.PitchesThrown", title: "#P", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.TS", title: "TS", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.TB", title: "TB", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.P_IP", format: "{0:n3}", title: "P/IP", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.P_BF", format: "{0:n3}", title: "P/BF", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } },
        { field: "stats.StrikePct", format: "{0:p2}", title: "Strike%", attributes: { "class": "text-right avg-cell" }, headerAttributes: { "class": "avg-cell" } }
      ],
      excel: {
        allPages: true,
        fileName: "fielding.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "stats.ERA", dir: "asc" }
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.pitchStatsData);
          }
        }
      })
    };

    function loadSchedule(callback) {
      // get the schedule
      $gameChanger.getSchedule(team, function (data) {
        angular.forEach(data, function (item) {
          if (item.result === undefined) {
            item.result = "TBD";
            item.state = {
              home: 0,
              away: 0
            }
          }
        });

        // initialize include values
        angular.forEach(data, function (game) {
          game.include = (game.type !== "Exhibition");
        });

        vm.schedule = data;
        vm.optionsScheduleGrid.gridObject.dataSource.read();

        if (typeof callback === "function")
          callback();


      });
    }

    function refreshData() {
      // clear data 
      vm.optionsPitchesSeenGrid.gridObject.dataSource.data([]);
      vm.optionsOutsGrid.gridObject.dataSource.data([]);
      vm.optionsRunnersGrid.gridObject.dataSource.data([]);
      vm.optionsDistGrid.gridObject.dataSource.data([]);
      vm.optionsFieldGrid.gridObject.dataSource.data([]);
      vm.optionsStatsGrid.gridObject.dataSource.data([]);
      vm.optionsPitchStatsGrid.gridObject.dataSource.data([]);


      // only include games where include = true;
      var dataInclude = [];
      angular.forEach(vm.schedule, function(game) {
        if (game.include)
          dataInclude.push(game);
      });

      $gameChanger.getStats(team, dataInclude, function (data) {
        vm.data = data;

        angular.forEach(vm.data.pitchData, function (item) {
          item.pitches = item.strikesLooking + item.strikesSwinging + item.balls + item.fouls + item.inPlay;
          item.pitchesPerPa = item.pitches / item.pa;
        });
        vm.optionsPitchesSeenGrid.gridObject.dataSource.read();

        var outsKeys = ["0", "1", "2"];
        sumByKeys(vm.data.outsData, outsKeys, "outs");
        vm.optionsOutsGrid.gridObject.dataSource.read();

        var runnerKeys = ["0", "1", "12", "13", "123", "2", "23", "3"];
        sumByKeys(vm.data.runnersData, runnerKeys, "runner");

        // now calculate empty, runners on and scoring position
        sumByKeys(vm.data.runnersData, ["0"], undefined, "empty");
        sumByKeys(vm.data.runnersData, ["1", "12", "13", "123", "2", "23", "3"], undefined, "onbase");
        sumByKeys(vm.data.runnersData, ["12", "13", "123", "2", "23", "3"], undefined, "scoring");
        vm.optionsRunnersGrid.gridObject.dataSource.read();

        // hit distribution
        sumValuesPrimitive(vm.data.distData, ["LF", "CF", "RF", "SF"], "of");
        sumValuesPrimitive(vm.data.distData, ["P", "C", "1B", "2B", '3B', "SS"], "if");
        sumValuesPrimitive(vm.data.distData, ["P", "C", "CF", 'SF'], "middle");
        sumValuesPrimitive(vm.data.distData, ["1B", "2B", "RF"], "right");
        sumValuesPrimitive(vm.data.distData, ['3B', "SS", "LF"], "left");
        sumValuesPrimitive(vm.data.distData, ["P", "C", '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SF'], "total");
        vm.optionsDistGrid.gridObject.dataSource.read();

        // fielding distribution
        angular.forEach(vm.data.fieldData, function (item) {
          angular.forEach(["P", "C", '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SF', "total"], function (pos) {
            item[pos].innings = Math.floor(item[pos].thirds / 3) + (item[pos].thirds % 3) / 10;

            if (pos !== "total")
              item["total"].start += item[pos].start;
          });

          item["field1B"] = item["1B"];
          item["field2B"] = item["2B"];
          item["field3B"] = item["3B"];
        });
        vm.optionsFieldGrid.gridObject.dataSource.read();

        // regular stat calculation
        angular.forEach(vm.data.statsData, function (item) {
          item.stats.Double = item.stats["2B"];
          item.stats.Triple = item.stats["3B"];
          item.stats.SAC = item.stats.SHB + item.stats.SHF;
        });
        vm.optionsStatsGrid.gridObject.dataSource.read();

        angular.forEach(vm.data.pitchStatsData, function(item) {
          item.stats.PitchesThrown = item.stats["#P"];
          item.stats.GP = item.stats["GP:P"];
        });
        vm.optionsPitchStatsGrid.gridObject.dataSource.read();
      });
    }

    loadSchedule(refreshData);
  }
]);

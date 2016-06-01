app.controller('GameChangerScheduleController', [
  '$scope', '$gameChanger', '$stateParams', "$globals", "$filter", "$state",
  function ($scope, $gameChanger, $stateParams, $globals, $filter, $state) {
    var vm = this;
    vm.data = {
      pitchData: [],
      countData: [],
      outData: [],
      runnersData: [],
      distData: [],
      fieldData: [],
      statData: [],
      pitchStatsData: []
    };

    var teamKeys = undefined;
    switch ($state.current.name) {
      case "specs":
        teamKeys = {
          season: $stateParams.season,
          name: $stateParams.name,
          teamId: $stateParams.teamId,
          displayName: $stateParams.name
        };
        break;
      default:
        var team = $stateParams.team;
        if (team !== undefined)
          team = team.toUpperCase();

        teamKeys = $globals.getKeys(team);
        break;
    }
    
    vm.name = teamKeys.displayName;

    var sumValuesPrimitive = function (itemList, key, totalKey) {
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

      angular.forEach(itemList, function (item) {
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
    $scope.$watch("vm.gameSelection", function () {
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



    vm.optionsAggregateFunctions = {
      getAggregates: function(gridOptions) {
        if (gridOptions !== undefined) {
          var ds = gridOptions.dataSource;
          if (ds !== undefined) {
            var aggregates = ds.aggregates();
            return aggregates;
          }
        }
      },
      setFooterAndSum: function(gridColumns) {
        angular.forEach(gridColumns, function(item) {
          item.headerAttributes = item.attributes;
          item.footerAttributes = item.attributes;

          if (item.aggregates !== undefined && item.aggregates.length > 0)
            switch (item.aggregates[0]) {
              case "sum":
                item.footerTemplate = "#=(sum || 0)#";
                break;
            }
        });
      }
    };
    
    vm.optionsAggregateFunctions.getAvg = function(gridOptions, n, d, format) {
      var agg = vm.optionsAggregateFunctions.getAggregates(gridOptions);
      format = format || "n3";
      
      if (agg) {
        // sum the N and the D
        var sumN = 0;
        var sumD = 0;
        angular.forEach(n, function(field) {
          sumN += agg[field].sum;
        });
        angular.forEach(d, function(field) {
          sumD += agg[field].sum;
        });
        
        var avg = sumD === 0 ? 0 : (sumN / sumD);
        return format === "raw" ? avg : kendo.toString(avg, format);
      }
      else
        return "";
    };
    
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

    vm.optionsAggregateFunctions.pitches = {
      pitchesPerPa: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsPitchesSeenGrid, ["pitches"], ["pa"], "n3");
      }
    };
    
    vm.optionsPitchesSeenGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", footerTemplate: "Totals", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" } },
        { field: "pa", aggregates: ["sum"], title: "PA", attributes: { "class": "text-right stat-cell" } },
        { field: "pitches", aggregates: ["sum"], title: "P Seen", attributes: { "class": "text-right stat-cell" } },
        { field: "pitchesPerPa", footerTemplate: vm.optionsAggregateFunctions.pitches.pitchesPerPa, format: "{0:n3}", title: "P / PA", attributes: { "class": "text-right avg-cell" } },
        { field: "strikesLooking", aggregates: ["sum"], title: "K / L", attributes: { "class": "text-right stat-cell" } },
        { field: "strikesSwinging", aggregates: ["sum"], title: "K / S", attributes: { "class": "text-right stat-cell" } },
        { field: "fouls", aggregates: ["sum"], title: "Fouls", attributes: { "class": "text-right stat-cell" } },
        { field: "balls", aggregates: ["sum"], title: "Balls", attributes: { "class": "text-right stat-cell" } },
        { field: "inPlay", aggregates: ["sum"], title: "In Play", attributes: { "class": "text-right stat-cell" } }
      ],
      excel: {
        allPages: true,
        fileName: "pitches.xlsx",
        filterable: true
      },
      sortable: true,
      resizable: true,
      dataSource: new kendo.data.DataSource({
        sort: [
          { field: "pitchesPerPa", dir: "desc" }
        ],
        aggregate: [
          {field: "pa", aggregate: "sum"},
          {field: "pitches", aggregate: "sum"},
          {field: "strikesLooking", aggregate: "sum"},
          {field: "strikesSwinging", aggregate: "sum"},
          {field: "fouls", aggregate: "sum"},
          {field: "balls", aggregate: "sum"},
          {field: "inPlay", aggregate: "sum"}
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.pitchData);
          }
        }
      })
    };
    vm.optionsAggregateFunctions.setFooterAndSum(vm.optionsPitchesSeenGrid.columns);

    vm.optionsAggregateFunctions.outsRunners = {
      AVG: function(gridOptions, key) {
        var ds = vm.optionsAggregateFunctions.getAggregates(gridOptions);
        if (ds !== undefined) {
          var avg = vm.optionsAggregateFunctions.getAvg(gridOptions, [key + ".H"], [key + ".AB"], "raw");
          return kendo.toString(avg, "n3") + " (" + ds[key + ".H"].sum + "-" + ds[key + ".AB"].sum + ")";
        }
        return "";
      },
      OBP: function(gridOptions, key) {
        var ds = vm.optionsAggregateFunctions.getAggregates(gridOptions);
        if (ds !== undefined) {
          var avg = vm.optionsAggregateFunctions.getAvg(gridOptions, [key + ".OnBase"], [key + ".PA"], "raw");
          return kendo.toString(avg, "n3") + " (" + ds[key + ".OnBase"].sum + "-" + ds[key + ".PA"].sum + ")";
        }
        return "";
      }
    };
    vm.optionsAggregateFunctions.outs = {
      AVG: function(key) {
        return vm.optionsAggregateFunctions.outsRunners.AVG(vm.optionsOutsGrid, key);
      },
      OBP: function(key) {
        return vm.optionsAggregateFunctions.outsRunners.OBP(vm.optionsOutsGrid, key);
      }
    }
    
    vm.optionsOutsGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", footerTemplate: "Total", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" }, headerAttributes: { "class": "jersey-cell" } },
        { field: "outs0.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.AVG("outs0");}, title: "AVG (0 Outs)", template: "#= kendo.toString(outs0.AVG, 'n3')# (#= outs0.H#-#= outs0.AB#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "outs0.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.OBP("outs0");}, title: "OBP (0 Outs)", template: "#= kendo.toString(outs0.OBP, 'n3')# (#= outs0.OnBase#-#= outs0.PA#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "outs1.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.AVG("outs1");}, title: "AVG (1 Outs)", template: "#= kendo.toString(outs1.AVG, 'n3')# (#= outs1.H#-#= outs1.AB#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "outs1.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.OBP("outs1");}, title: "OBP (1 Outs)", template: "#= kendo.toString(outs1.OBP, 'n3')# (#= outs1.OnBase#-#= outs1.PA#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "outs2.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.AVG("outs2");}, title: "AVG (2 Outs)", template: "#= kendo.toString(outs2.AVG, 'n3')# (#= outs2.H#-#= outs2.AB#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "outs2.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.OBP("outs2");}, title: "OBP (2 Outs)", template: "#= kendo.toString(outs2.OBP, 'n3')# (#= outs2.OnBase#-#= outs2.PA#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "total.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.AVG("total");}, title: "AVG (Total)", template: "#= kendo.toString(total.AVG, 'n3')# (#= total.H#-#= total.AB#)", attributes: { "class": "text-right avgbig-cell" } },
        { field: "total.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.outs.OBP("total");}, title: "OBP (Total)", template: "#= kendo.toString(total.OBP, 'n3')# (#= total.OnBase#-#= total.PA#)", attributes: { "class": "text-right avgbig-cell" } }
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
        aggregate: [
          {field: "outs0.AB", aggregate: "sum"},
          {field: "outs0.H", aggregate: "sum"},
          {field: "outs0.OnBase", aggregate: "sum"},
          {field: "outs0.PA", aggregate: "sum"},
          {field: "outs1.AB", aggregate: "sum"},
          {field: "outs1.H", aggregate: "sum"},
          {field: "outs1.OnBase", aggregate: "sum"},
          {field: "outs1.PA", aggregate: "sum"},
          {field: "outs2.AB", aggregate: "sum"},
          {field: "outs2.H", aggregate: "sum"},
          {field: "outs2.OnBase", aggregate: "sum"},
          {field: "outs2.PA", aggregate: "sum"},
          {field: "total.AB", aggregate: "sum"},
          {field: "total.H", aggregate: "sum"},
          {field: "total.OnBase", aggregate: "sum"},
          {field: "total.PA", aggregate: "sum"}
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.outsData);
          }
        }
      })
    };
    vm.optionsAggregateFunctions.setFooterAndSum(vm.optionsOutsGrid.columns);

    vm.optionsAggregateFunctions.runners = {
      AVG: function(key) {
        return vm.optionsAggregateFunctions.outsRunners.AVG(vm.optionsRunnersGrid, key);
      },
      OBP: function(key) {
        return vm.optionsAggregateFunctions.outsRunners.OBP(vm.optionsRunnersGrid, key);
      }
    }
    
    vm.optionsRunnersGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", footerTemplate: "Totals", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" }},
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" }},
        { field: "empty.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.AVG("empty");}, title: "AVG (Empty)", template: "#= kendo.toString(empty.AVG, 'n3')# (#= empty.H#-#= empty.AB#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "empty.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.OBP("empty");}, title: "OBP (Empty)", template: "#= kendo.toString(empty.OBP, 'n3')# (#= empty.OnBase#-#= empty.PA#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "onbase.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.AVG("onbase");}, title: "AVG (On Base)", template: "#= kendo.toString(onbase.AVG, 'n3')# (#= onbase.H#-#= onbase.AB#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "onbase.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.OBP("onbase");}, title: "OBP (On Base)", template: "#= kendo.toString(onbase.OBP, 'n3')# (#= onbase.OnBase#-#= onbase.PA#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "scoring.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.AVG("scoring");}, title: "AVG (Scoring Pos)", template: "#= kendo.toString(scoring.AVG, 'n3')# (#= scoring.H#-#= scoring.AB#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "scoring.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.OBP("scoring");}, title: "OBP (Scoring Pos)", template: "#= kendo.toString(scoring.OBP, 'n3')# (#= scoring.OnBase#-#= scoring.PA#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "total.AVG", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.AVG("total");}, title: "AVG (Total)", template: "#= kendo.toString(total.AVG, 'n3')# (#= total.H#-#= total.AB#)", attributes: { "class": "text-right avgbig-cell" }},
        { field: "total.OBP", footerTemplate: function() {return vm.optionsAggregateFunctions.runners.OBP("total");}, title: "OBP (Total)", template: "#= kendo.toString(total.OBP, 'n3')# (#= total.OnBase#-#= total.PA#)", attributes: { "class": "text-right avgbig-cell" }}
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
        aggregate: [
          {field: "empty.AB", aggregate: "sum"},
          {field: "empty.H", aggregate: "sum"},
          {field: "empty.OnBase", aggregate: "sum"},
          {field: "empty.PA", aggregate: "sum"},
          {field: "onbase.AB", aggregate: "sum"},
          {field: "onbase.H", aggregate: "sum"},
          {field: "onbase.OnBase", aggregate: "sum"},
          {field: "onbase.PA", aggregate: "sum"},
          {field: "scoring.AB", aggregate: "sum"},
          {field: "scoring.H", aggregate: "sum"},
          {field: "scoring.OnBase", aggregate: "sum"},
          {field: "scoring.PA", aggregate: "sum"},
          {field: "total.AB", aggregate: "sum"},
          {field: "total.H", aggregate: "sum"},
          {field: "total.OnBase", aggregate: "sum"},
          {field: "total.PA", aggregate: "sum"}
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.runnersData);
          }
        }
      })
    };
    vm.optionsAggregateFunctions.setFooterAndSum(vm.optionsRunnersGrid.columns);
    

    vm.optionsDistGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" } },
        { field: "if", aggregates: ["sum"], title: "Infield", attributes: { "class": "text-right stat-cell" } },
        { field: "of", aggregates: ["sum"], title: "Outfield", attributes: { "class": "text-right stat-cell" } },
        { field: "left", aggregates: ["sum"], title: "Left Side", attributes: { "class": "text-right stat-cell" } },
        { field: "middle", aggregates: ["sum"], title: "Middle", attributes: { "class": "text-right stat-cell" } },
        { field: "right", aggregates: ["sum"], title: "Right Side", attributes: { "class": "text-right stat-cell" } },
        { field: "total", aggregates: ["sum"], title: "Total", attributes: { "class": "text-right stat-cell" } }
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
          { field: "total", dir: "desc" }
        ],
        aggregate: [
          {field: "if", aggregate: "sum"},
          {field: "of", aggregate: "sum"},
          {field: "left", aggregate: "sum"},
          {field: "middle", aggregate: "sum"},
          {field: "right", aggregate: "sum"},
          {field: "total", aggregate: "sum"}
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.distData);
          }
        }
      })
    };
    vm.optionsAggregateFunctions.setFooterAndSum(vm.optionsDistGrid.columns);

    vm.optionsFieldGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" }, headerAttributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" }, headerAttributes: { "class": "jersey-cell" } },
        { field: "P.games", title: "P", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "C.games", title: "C", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "field1B.games", title: "1B", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "field2B.games", title: "2B", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "field3B.games", title: "3B", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "SS.games", title: "SS", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "LF.games", title: "LF", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "CF.games", title: "CF", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "RF.games", title: "RF", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "SF.games", title: "SF", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } },
        { field: "total.games", title: "Total", attributes: { "class": "text-right avgbig-cell" }, headerAttributes: { "class": "avgbig-cell" } }
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
          read: function (e) {
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
    
    vm.optionsAggregateFunctions.stats = {
      SLGRaw: function() {
        var agg = vm.optionsAggregateFunctions.getAggregates(vm.optionsStatsGrid);
        if (agg) {
          var n = agg["stats.H"].sum + agg["stats.Double"].sum + (agg["stats.Triple"].sum * 2) + (agg["stats.HR"].sum * 3);
          var d = agg["stats.AB"].sum;
          var avg = d === 0 ? 0 : (n / d);
          return avg;
        }
        else 
          return 0;
      },
      OBPRaw: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsStatsGrid, ["stats.H", "stats.BB", "stats.HBP"], ["stats.AB", "stats.BB", "stats.HBP"], "raw");
      }
    };
    
    var statFunctions = {
      SO: function() {
        if (vm.optionsStatsGrid !== undefined) {
          var ds = vm.optionsStatsGrid.dataSource;
          if (ds !== undefined) {
            var aggregates = ds.aggregates();
            return aggregates === undefined || aggregates["stats.SO"] === undefined ? "" :  (aggregates["stats.SO"].sum + " / " + aggregates["stats.SOL"].sum);
          }
        }
      },
      KPCT: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsStatsGrid, ["stats.SO"], ["stats.PA"], "0.00%");
      },
      AVG: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsStatsGrid, ["stats.H"], ["stats.AB"], "n3");
      },
      OBP: function() {
        return kendo.toString(vm.optionsAggregateFunctions.stats.OBPRaw(), "n3");
      },
      SLG: function() {
        return kendo.toString(vm.optionsAggregateFunctions.stats.SLGRaw(), "n3");
      },
      OPS: function() {
        return kendo.toString(vm.optionsAggregateFunctions.stats.SLGRaw() + vm.optionsAggregateFunctions.stats.OBPRaw(), "n3");
      },
      QABPCT: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsStatsGrid, ["stats.QAB"], ["stats.PA"], "0.00%");
      },
      AVGRISP: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsStatsGrid, ["stats.HRISP"], ["stats.ABRISP"], "n3");
      },
      GP: function() {
        return vm.schedule === undefined ? 0 : vm.schedule.length;
      }
    };
    
    // merge the functions into one object.
    angular.merge(vm.optionsAggregateFunctions.stats, statFunctions);
    
    vm.optionsStatsGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", footerTemplate: "Totals", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", footerTemplate: "", attributes: { "class": " text-right jersey-cell" }, headerAttributes: { "class": "jersey-cell" } },
        { field: "stats.GP", footerTemplate: vm.optionsAggregateFunctions.stats.GP, title: "GP", attributes: { "class": "text-right stat-cell" }, headerAttributes: { "class": "stat-cell" } },
        { field: "stats.PA", aggregates: ["sum"], title: "PA", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.AB", aggregates: ["sum"], title: "AB", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.R", aggregates: ["sum"], title: "R", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.H", aggregates: ["sum"], title: "H", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.Double", aggregates: ["sum"], title: "2B", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.Triple", aggregates: ["sum"], title: "3B", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.HR", aggregates: ["sum"], title: "HR", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.RBI", aggregates: ["sum"], title: "RBI", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.BB", aggregates: ["sum"], title: "BB", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.HBP", aggregates: ["sum"], title: "HBP", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.SO", footerTemplate: vm.optionsAggregateFunctions.stats.SO, title: "K / KL", template: "#= stats.SO# / #= stats.SOL#", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.KPCT", footerTemplate: vm.optionsAggregateFunctions.stats.KPCT, format: "{0:0.00%}", title: "K%", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.SB", aggregates: ["sum"], title: "SB", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.CS", aggregates: ["sum"], title: "CS", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.LOB", aggregates: ["sum"], title: "LOB", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.SAC", aggregates: ["sum"], title: "SAC", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.ROE", aggregates: ["sum"], title: "ROE", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.AVG", footerTemplate: vm.optionsAggregateFunctions.stats.AVG, format: "{0:n3}", title: "AVG", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.OBP", footerTemplate: vm.optionsAggregateFunctions.stats.OBP, format: "{0:n3}", title: "OBP", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.SLG", footerTemplate: vm.optionsAggregateFunctions.stats.SLG, format: "{0:n3}", title: "SLG", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.OPS", footerTemplate: vm.optionsAggregateFunctions.stats.OPS, format: "{0:n3}", title: "OPS", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.AVGRISP", footerTemplate: vm.optionsAggregateFunctions.stats.AVGRISP, format: "{0:n3}", title: "AVG-RISP", attributes: { "class": "text-right avgbig-cell" } },
        { field: "stats.QABPCT", footerTemplate: vm.optionsAggregateFunctions.stats.QABPCT, format: "{0:0.00%}", title: "QAB%", attributes: { "class": "text-right avg-cell" } }
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
        aggregate: [
          {field: "stats.PA", aggregate: "sum"},
          {field: "stats.AB", aggregate: "sum"},
          {field: "stats.R", aggregate: "sum"},
          {field: "stats.H", aggregate: "sum"},
          {field: "stats.Double", aggregate: "sum"},
          {field: "stats.Triple", aggregate: "sum"},
          {field: "stats.HR", aggregate: "sum"},
          {field: "stats.RBI", aggregate: "sum"},
          {field: "stats.BB", aggregate: "sum"},
          {field: "stats.HBP", aggregate: "sum"},
          {field: "stats.SO", aggregate: "sum"},
          {field: "stats.SOL", aggregate: "sum"},
          {field: "stats.SB", aggregate: "sum"},
          {field: "stats.CS", aggregate: "sum"},
          {field: "stats.LOB", aggregate: "sum"},
          {field: "stats.SAC", aggregate: "sum"},
          {field: "stats.ROE", aggregate: "sum"},
          {field: "stats.QAB", aggregate: "sum"},
          {field: "stats.HRISP", aggregate: "sum"},
          {field: "stats.ABRISP", aggregate: "sum"}
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.statsData);
          }
        }
      })
    };
    vm.optionsAggregateFunctions.setFooterAndSum(vm.optionsStatsGrid.columns);

    vm.optionsAggregateFunctions.pitchStats = {
      ERA: function() {
        var avg = vm.optionsAggregateFunctions.getAvg(vm.optionsPitchStatsGrid, ["stats.ER"], ["stats.outs"], "raw") * 21;
        return kendo.toString(avg, "n3");
      },
      IP: function() {
        var ds = vm.optionsAggregateFunctions.getAggregates(vm.optionsPitchStatsGrid);
        if (ds !== undefined) {
          var ipRaw = ds["stats.outs"].sum / 3;
          var fullIp = Math.floor(ipRaw);
          var decimalIp = ds["stats.outs"].sum % 3;
          return fullIp + "." + decimalIp;
        }
        return "";
      },
      WHIP: function() {
        var avg = vm.optionsAggregateFunctions.getAvg(vm.optionsPitchStatsGrid, ["stats.BB", "stats.H"], ["stats.outs"], "raw") * 3;
        return kendo.toString(avg, "n3");
      },
      P_IP: function() {
        var avg = vm.optionsAggregateFunctions.getAvg(vm.optionsPitchStatsGrid, ["stats.PitchesThrown"], ["stats.outs"], "raw") * 3;
        return kendo.toString(avg, "n3");
      },
      P_BF: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsPitchStatsGrid, ["stats.PitchesThrown"], ["stats.BF"], "n3");
      },
      StrikePct: function() {
        return vm.optionsAggregateFunctions.getAvg(vm.optionsPitchStatsGrid, ["stats.TS"], ["stats.PitchesThrown"], "0.00%");
      }
    };
    
    vm.optionsPitchStatsGrid = {
      gridObject: null,
      autoBind: false,
      columns: [
        { field: "player.fname", title: "Name", template: "#= player.fname# #= player.lname#", attributes: { "class": "name-cell" } },
        { field: "player.num", title: "#", attributes: { "class": " text-right jersey-cell" } },
        { field: "stats.GP", footerTemplate: vm.optionsAggregateFunctions.stats.GP, title: "GP", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.GS", title: "GS", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.IP", footerTemplate: vm.optionsAggregateFunctions.pitchStats.IP, format: "{0:n1}", title: "IP", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.W", aggregates: ["sum"], title: "W", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.L", aggregates: ["sum"], title: "L", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.H", aggregates: ["sum"], title: "H", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.R", aggregates: ["sum"], title: "R", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.ER", aggregates: ["sum"], title: "ER", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.BB", aggregates: ["sum"], title: "BB", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.SO", aggregates: ["sum"], title: "K", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.ERA", footerTemplate: vm.optionsAggregateFunctions.pitchStats.ERA, format: "{0:n2}", title: "ERA", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.WHIP", footerTemplate: vm.optionsAggregateFunctions.pitchStats.WHIP, format: "{0:n3}", title: "WHIP", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.PitchesThrown", aggregates: ["sum"], title: "#P", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.TS", aggregates: ["sum"], title: "TS", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.TB", aggregates: ["sum"], title: "TB", attributes: { "class": "text-right stat-cell" } },
        { field: "stats.P_IP", footerTemplate: vm.optionsAggregateFunctions.pitchStats.P_IP, format: "{0:n3}", title: "P/IP", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.P_BF", footerTemplate: vm.optionsAggregateFunctions.pitchStats.P_BF, format: "{0:n3}", title: "P/BF", attributes: { "class": "text-right avg-cell" } },
        { field: "stats.StrikePct", footerTemplate: vm.optionsAggregateFunctions.pitchStats.StrikePct, format: "{0:0.00%}", title: "Strike%", attributes: { "class": "text-right avg-cell" } }
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
          { field: "stats.IP", dir: "desc" }
        ],
        aggregate: [
          {field: "stats.W", aggregate: "sum"},
          {field: "stats.L", aggregate: "sum"},
          {field: "stats.H", aggregate: "sum"},
          {field: "stats.R", aggregate: "sum"},
          {field: "stats.ER", aggregate: "sum"},
          {field: "stats.BB", aggregate: "sum"},
          {field: "stats.SO", aggregate: "sum"},
          {field: "stats.PitchesThrown", aggregate: "sum"},
          {field: "stats.TS", aggregate: "sum"},
          {field: "stats.TB", aggregate: "sum"},
          {field: "stats.outs", aggregate: "sum"},
          {field: "stats.BF", aggregate: "sum"}
        ],
        transport: {
          read: function (e) {
            e.success(vm.data.pitchStatsData);
          }
        }
      })
    };
    vm.optionsAggregateFunctions.setFooterAndSum(vm.optionsPitchStatsGrid.columns);
    
    function loadSchedule(callback) {
      // get the schedule
      $gameChanger.getSchedule(teamKeys, function (data) {
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
      angular.forEach(vm.schedule, function (game) {
        if (game.include)
          dataInclude.push(game);
      });

      $gameChanger.getStats(teamKeys, dataInclude, function (data) {
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
          item.stats.KPCT = item.stats.SO / (item.stats.PA || 1)
        });
        vm.optionsStatsGrid.gridObject.dataSource.read();

        angular.forEach(vm.data.pitchStatsData, function (item) {
          item.stats.PitchesThrown = item.stats["#P"];
          item.stats.GP = item.stats["GP:P"];
        });
        vm.optionsPitchStatsGrid.gridObject.dataSource.read();
      });
    }

    loadSchedule(refreshData);
  }
]);

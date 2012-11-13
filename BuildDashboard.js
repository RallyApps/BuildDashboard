function BuildDashboard() {
    //Data
    var rallyDataSource;
    var buildDefs = [];
    var buildResults = [];

    //UI elements
    var buildDefTable;
    var buildDefWait;
    var buildTrendReport;

    //HTML
    var buildDefTablediv = "buildDefTable";

    //General Variables
    var recentDate = rally.sdk.util.DateTime.add(new Date(), "week", -2);
    var high_success_min = 75/100;
    var med_success_min = 60/100;

    function loadBuilddefs() {
        buildDefWait = new rally.sdk.ui.basic.Wait({hideTarget: false});
        buildDefWait.display(buildDefTablediv);

        var queryConfig = {
            type : 'builddefinition',
            key  : 'builddefs',
            fetch: 'Name,Description,ObjectID,LastStatus',
            order: 'Name',
            pagesize: 200,
            query: '(LastBuild != null)'
        };
        rallyDataSource.find(queryConfig, gatherBuildDefs);
    }

    function gatherBuildDefs(results) {
        if (results.builddefs.length === 0) {
            gatherBuildresults([]);
        } else {
            for (var i=0; i < results.builddefs.length; i++) {
                buildDefs.push(results.builddefs[i]);

                var builddefref = results.builddefs[i]._ref;
                var query_key = "builds-" + results.builddefs[i].ObjectID;
                var query_date = rally.sdk.util.DateTime.toIsoString(recentDate);

                var query_string = '((BuildDefinition = "' + builddefref + '") AND (CreationDate > "';
                query_string = query_string + query_date + '" ))';

                var queryConfig = {
                    type    : 'build',
                    key     : query_key,
                    fetch   : 'Status,CreationDate,Number',
                    query   : query_string,
                    order   : 'CreationDate Desc',
                    pagesize: 20
                };
                rallyDataSource.find(queryConfig, gatherBuildresults);
            }
        }
    }

    function gatherBuildresults(results) {
        if (buildDefs.length > 0) {
            buildResults.push(results);
        }
        if (buildDefs.length === buildResults.length) {
            showBuildDefTable();
        }
    }

    function showBuildDefTable() {
        if (buildDefTable) { buildDefTable.destroy(); }

        var tableConfig = {
            sortingEnabled : false,
            columnKeys     : [ 'Name', 'LastStatus', 'MostRecentRatio' ],
            columnHeaders  : [ 'Name', 'Last Build', 'Recent'],
            noDataMessage  : "No Build Definitions available"
        };

        buildDefTable = new rally.sdk.ui.Table(tableConfig);

        for ( var i = 0; i < buildDefs.length; i++) {
            var tempkey = "builds-" + buildDefs[i].ObjectID;
            var recentratio = getRecentRatio(tempkey);

            var rowinfo = {
                'Name'              : buildDefs[i].Name,
                'LastStatus'        : buildDefs[i].LastStatus,
                'MostRecentRatio'   : recentratio
            };
            buildDefTable.addRow(rowinfo);
        }
        buildDefTable.addEventListener(buildDefTable.getValidEvents().onCellClick, showBuildDefDetail);

        buildDefWait.hide();

        buildDefTable.display(document.getElementById(buildDefTablediv));

        dijit.byId("buildDefTableGrid").selection.setSelected(0,true);
        if (buildDefs.length > 0) {
            showBuildDefDetail({}, {rowIndex:0});
        }
    }

    function getRecentRatio(buildkey) {
        //Assuming SUCCESS and FAILURE - only counting Success vs other
        var builds;
        for (var i=0; i < buildResults.length; i++) {
            if (buildResults[i][buildkey] === undefined) { continue; }
            builds = buildResults[i][buildkey];
        }
        if (builds === undefined ) { return "No Recent Builds"; }
        var successes = 0;
        for (var j=0; j < builds.length; j++) {
            if (builds[j].Status == "SUCCESS") { successes = successes + 1; }
        }

        var returnclass = "";
        var successratio = successes / builds.length;
        if (successratio > (high_success_min) ) { returnclass = "highsuccess"; }
        else if ( successratio > (med_success_min) ) {returnclass = "medsuccess"; }
        else { returnclass = "lowsuccess"; }

        returnval = "<span class='" + returnclass + "'>" + successes + " / " + builds.length + "</span>";
        return returnval;
    }

    function showBuildDefDetail(sender, args) {
        var buildDef = buildDefs[args.rowIndex];
        if (buildTrendReport === undefined) {
            buildTrendReport = new BuildTrendReport(rallyDataSource, "buildTrends");
        }
        buildTrendReport.showBuildTrend(buildDef);
    }

    this.display = function(element) {
        rallyDataSource = new rally.sdk.data.RallyDataSource("__WORKSPACE_OID__",
                "__PROJECT_OID__",
                "__PROJECT_SCOPING_UP__",
                "__PROJECT_SCOPING_DOWN__");

        rally.sdk.ui.AppHeader.setHelpTopic("231");
        loadBuilddefs();
    };
}

function BuildTrendReport(rallydatasource, detail_div) {
    var that = this;
    var rallyDataSource;
    var buildDef;

    //UI elements
    var buildTrendTable;
    var buildTrendGraph;
    var buildTrendLegend;
    var buildTrendWait;
    var buildTrendRadio;
    var buildTrendReleaseDD;

    //UI divs
    var buildTrendLabeldiv;
    var buildTrendDescriptiondiv;
    var buildTrendStatusRatiodiv;
    var buildTrendLegenddiv;
    var buildTrendGraphdiv;
    var buildTrendTablediv;
    var buildTrendRadiodiv;
    var buildTrendReleaseDDdiv;
    var spinnerdiv;


    function display() {
        buildTrendLabeldiv.innerHTML = buildDef.Name;
        buildTrendDescriptiondiv.innerHTML = buildDef.Description || "";

        if (buildTrendRadio !== undefined) {
            buildTrendRadio.destroy();
            buildTrendReleaseDD.destroy();
        }

        showRadioGroup();
        buildTrendRadio.setValue("30");
        buildTrendTBchange({}, {value:"30"});
    }

    function showRadioGroup(){
        dojo.style(buildTrendReleaseDDdiv, { "display" : "none"} );

        var config = {
            radios: [{label:"Last 30 days", value:"30"}, {label:"Last 90 days", value:"90"}, {label:"By Release", value:"Release"}],
            groupName       :   "TrendTimebox",
            showLabel       :   true,
            labelPosition   :   "after",
            defaultValue    :   "30"
        };
        buildTrendRadio = new rally.sdk.ui.basic.RadioButtonGroup(config);
        buildTrendRadio.display(buildTrendRadiodiv, buildTrendTBchange);

        var configDD = {
            showLabel:false
        };
        buildTrendReleaseDD = new rally.sdk.ui.ReleaseDropdown(configDD, rallyDataSource);
        buildTrendReleaseDD.display(buildTrendReleaseDDdiv, buildTrendReleaseDDChange);
    }

    function buildTrendTBchange(sender, args) {
        var optionpicked = args.value;

        if (optionpicked === "Release") {
            dojo.style(buildTrendReleaseDDdiv, { "display" : "inline"} );
            buildTrendReleaseDDChange();
        }
        else {
            dojo.style(buildTrendReleaseDDdiv, { "display" : "none"} );

            var today = new Date();
            var gmtHours = today.getTimezoneOffset()/60;
            today = rally.sdk.util.DateTime.add(today, "hour", gmtHours);

            var delta = (parseInt(optionpicked, 10) === 90) ? -90 : -30;
            var subtr = rally.sdk.util.DateTime.add(today, "day", delta);

            var startdate = rally.sdk.util.DateTime.toIsoString(subtr);
            var enddate   = rally.sdk.util.DateTime.toIsoString(today);

            queryBuildDefDetail(startdate, enddate);
        }
    }

    function buildTrendReleaseDDChange(sender, args) {
        if (dojo.style(buildTrendReleaseDDdiv,"display") !== "none") {
            var startdate = buildTrendReleaseDD.getSelectedStart();
            var enddate = buildTrendReleaseDD.getSelectedEnd();
            queryBuildDefDetail(startdate,enddate);
        }
    }

    function queryBuildDefDetail(start_date,end_date) {
        var builddefref = buildDef._ref;

        buildTrendWait = new rally.sdk.ui.basic.Wait({hideTarget: false});
        buildTrendWait.display(spinnerdiv);

        var query_string = '((BuildDefinition = "' + builddefref + '") AND ((CreationDate > "';
        query_string = query_string + start_date + '" ) AND (CreationDate < "' + end_date + '")))';

        var queryConfig = {
            type    : 'build',
            key     : 'buildtrend',
            fetch   : 'Status,CreationDate,Number,URI,Duration',
            query   : query_string,
            order   : 'CreationDate Desc'
        };

        rallyDataSource.findAll(queryConfig, showBuildTrendInfo);
    }

    function showBuildTrendInfo(results) {

        if (buildTrendTable !== undefined) {
            buildTrendTable.destroy();
        }

        var tableConfig = {
            sortingEnabled : false,
            columnKeys     : [ 'Number', 'Date', 'Duration', 'Status' ],
            columnHeaders  : [ 'Build #', 'Date', 'Duration', 'Status' ],
            columnWidths   : [ '15%', '30%', '25%', '30%' ],
            noDataMessage  : "No Builds available"
        };

        buildTrendTable = new rally.sdk.ui.Table(tableConfig);

        var successes = 0;

        for ( var i = 0; i < results.buildtrend.length; i++) {
            var numberlink = "<a href='"+ results.buildtrend[i].Uri + "' target='_blank'>" + results.buildtrend[i].Number  + "</a>";
            var rowinfo = {
                'Number'    : numberlink,
                'Date'      : results.buildtrend[i].CreationDate,
                'Duration'  : results.buildtrend[i].Duration || '',
                'Status'    : results.buildtrend[i].Status
            };
            buildTrendTable.addRow(rowinfo);
            if (results.buildtrend[i].Status === "SUCCESS") { successes++; }
        }


        buildTrendStatusRatiodiv.innerHTML = "<span class='highsuccess'>" + successes + "</span> / " + results.buildtrend.length;
        buildTrendWait.hide();
        buildTrendTable.display(buildTrendTablediv);
        showBuildTrendGraph(results);
    }

    function showBuildTrendGraph(results){
        var dates = [];
        var buildSuccesses = [];
        var buildOther = [];

        if (buildTrendGraph) {
            buildTrendGraph.destroy();
        }

        if (buildTrendLegend) {
            buildTrendLegend.destroy();
            buildTrendLegend = null;
        }

        if (results.buildtrend.length > 0) {
            buildTrendGraph = new dojox.charting.Chart2D(buildTrendGraphdiv);
            var chartconfig = {
                type        :   "StackedColumns",
                gap         :   3
            };
            buildTrendGraph.addPlot("default", chartconfig);

            //Fill the data series
            for (var i=(results.buildtrend.length - 1); i >= 0; i--) {
                var buildDate = rally.sdk.util.DateTime.fromIsoString(results.buildtrend[i].CreationDate);
                buildDate = rally.sdk.util.DateTime.format(buildDate, "yyyy-MM-dd");
                var buildDateIndex = dojo.indexOf(dates, buildDate);
                if ( buildDateIndex === -1 ) {
                    dates.push(buildDate);
                    buildSuccesses.push(0);
                    buildOther.push(0);
                    buildDateIndex = dates.length - 1;
                }

                if (results.buildtrend[i].Status === "SUCCESS") {
                    buildSuccesses[buildDateIndex] = buildSuccesses[buildDateIndex] + 1;
                }
                else   {
                    buildOther[buildDateIndex] = buildOther[buildDateIndex] + 1;
                }
            }

            var datelabels = [];
            datelabels.push({value: 0, text: ""});

            for (var j = 0; j < dates.length; j++) {
                datelabels.push( { value: j+1, text: dates[j].substring(5, dates[j].length) } );
            }

            //Horizontal Axis Config
            var dateaxis = {
                fixLower:"minor",
                majorTickStep: 4,
                minorTickStep: 1,
                labels  : datelabels
            };
            buildTrendGraph.addAxis("x", dateaxis);

            //Vertical Axis Config
            var buildaxis = {
                vertical    : true,
                min: 0,
                minorTicks: false
            };
            buildTrendGraph.addAxis("y", buildaxis);
            buildTrendGraph.addSeries("Success", buildSuccesses);
            buildTrendGraph.addSeries("Failure", buildOther);

            setChartTheme();
            buildTrendGraph.setTheme(buildDashboard.themes.rallybuilds);
            var atooltip = new dojox.charting.action2d.Tooltip(buildTrendGraph, "default", {duration: 200, text: showTT});

            buildTrendGraph.render();

            buildTrendLegend = new dojox.charting.widget.Legend( {chart: buildTrendGraph},
                    dojo.create("div", {}, buildTrendLegenddiv));
        }
        else { buildTrendGraph = undefined; }
    }

    function showTT(event) {
        var datev = event.chart.axes.x.labels[event.index].text;
        var h1 = event.chart.series[0].data[event.index];
        var h2 = event.chart.series[1].data[event.index];
        var height = event.y;
        if (((h1+ h2) === height) && (h2 !== 0)) {height = h2;}
        return "(" + datev + ") - " + height;
    }

    function setChartTheme(){
        dojo.provide("buildDashboard.themes.rallybuilds");
        buildDashboard.themes.rallybuilds = new dojox.charting.Theme({
            colors: [
                "#f47168",
                "#6ab17d"
            ]
        });
    }

    function init(rallydatasource, detail_div) {
        rallyDataSource = rallydatasource;
        var detaildiv = dojo.byId(detail_div);

        var labeldivs               = dojo.create("div", { style : { "display" : "block" }}, detaildiv);
        buildTrendStatusRatiodiv    = dojo.create("div", {id: "buildTrendStatusRatio"}, labeldivs);
        buildTrendLabeldiv          = dojo.create("div", {id: "buildTrendLabel"}, labeldivs);
        buildTrendDescriptiondiv    = dojo.create("div", {id: "buildTrendDescription"}, labeldivs);

        var radiodivs               = dojo.create("div", {id: "buildTrendControlDiv"}, detaildiv);
        buildTrendRadiodiv          = dojo.create("div", {id: "buildTrendRadio"}, radiodivs);
        buildTrendReleaseDDdiv      = dojo.create("div", {id: "buildTrendReleaseDD"}, radiodivs);

        spinnerdiv                  = dojo.create("div", {id: "buildTrendspinner"}, detaildiv);

        buildTrendLegenddiv         = dojo.create("div", {id: "buildTrendLegend"}, detaildiv);
        buildTrendGraphdiv          = dojo.create("div", {id: "buildTrendGraph"}, detaildiv);
        buildTrendTablediv          = dojo.create("div", {id: "buildTrendTable"}, detaildiv);

        dojo.style(buildTrendRadiodiv, {"display" : "inline"});
        dojo.style(buildTrendReleaseDDdiv, {"display" : "none"});

        var tablestyle = {
            "display"       : "block",
            "marginLeft"   : "auto",
            "marginRight"  : "auto"
        };
        dojo.style(buildTrendTablediv, tablestyle);

        return that;
    }

    this.showBuildTrend = function(builddef) {
        buildDef = builddef;
        display();
    };

    this.destroy = function() {
        buildTrendRadio.destroy();
        buildTrendReleaseDD.destroy();

        buildTrendLegend.destroy();
        buildTrendGraph.destroy();
        buildTrendTable.destroy();
    };

    init(rallydatasource, detail_div);
}

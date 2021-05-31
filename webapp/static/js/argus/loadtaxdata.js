/*    
@licstart  The following is the entire license notice for the JavaScript code in this page. 

    Copyright (c) 2013, Cody Hinchliff
    Copyright (c) 2013, Joseph W. Brown
    Copyright (c) 2013, Jim Allman
    Copyright (c) 2013, Mark Holder

    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

@licend  The above is the entire license notice for the JavaScript code in this page.
*/

// the location of the TNRS query service
url = doTNRSForNames_url;   // passed from main HTML page template

/*
 * NOTE - This appears to be dead code, so I'm not adapting it to work with the autocompleteQuery method
 */

function roundDecimal(value, precision) {
    var t = Math.pow(10,precision);
	var result = Math.round(value*t)/t;
	return result;
}

function setup() {

    // attempt to get queried name from url string
    var searchStr = "";
    var treeStr = "";
    var domsource = "";
    if (location.search != "") {
        var tokstr = location.search.substr(1).split("?");
        var toks = String(tokstr).split("&");
        for (var i=0; i<toks.length; i++) {
            var arg = toks[i].split("=");

            if (arg[0] == "nodename")
                searchstr = arg[1];
        }
    }

    // run the tnrs query on the string or the tree
    if (searchstr != "")
        doNameRequest(searchstr);
}

function doNameRequest(searchStr) {

    // format the query to be sent to the tnrs
//  var jsonquerystring = '{"queryString":"' + decodeURIComponent(searchStr).replace("+", " ") + '"}';
    var jsonquerystring = '{"queryString":"' + decodeURIComponent(searchStr).replace(/\++/g, " ") + '"}';
    var method = "POST";
    var xobj = new XMLHttpRequest();

    // call tnrs to get results
    xobj.open(method, url, false);
    xobj.setRequestHeader("Accept", "");
    xobj.setRequestHeader("Content-Type","application/json");
    xobj.send(jsonquerystring);

    // parse json response
    var jsonRespStr = xobj.responseText;
    var respData = JSON.parse(jsonRespStr);

    // make the form that holds the tnrs results
    makeNamesForm(respData);

}

function makeNamesForm(respData) {

    // necessary wrapper: wait for page to load
    $(document).ready( function(){

        // create the form; results are organized in unordered lists
        var results = $("<ul class='results'></ul>");
        $("body").append(results);

        // for each queried name
        for(var i = 0; i < respData.results.length; i++) {

            // get the name itself
            var queriedName = respData.results[i].queried_name;
            var nameResultIdString = "taxEntry" + i;

            // create a sublist to hold matches to this name
            $(results).append("<li class='label'> results for '" + queriedName + "'</li>")
            var nameResult = $("<ul></ul>");
            $(results).append(nameResult);

            // print all matches to the sublist
            var matches = respData.results[i].matches;
            for (var j = 0; j < matches.length; j++) {
                var thisMatch = matches[j];

                var thisMatchResult = $("<li></li>");

                var matchForm = $("<form method='LINK' action='browser.html'></form>").append("<input type='hidden' name='domsource' value='ottol' />").append("<input type='hidden' name='nodeid' value='"+thisMatch.matchedNodeId+"' />").append("<input type='submit' value='View'>");
                
                thisMatchResult.append(matchForm).append("<span class='matchname'>"+thisMatch.matchedNodeName+"</span>").append("<span>"+thisMatch.parentName+"</span>").append("<span>"+thisMatch.nomenCode+"</span>").append("<span>"+roundDecimal(thisMatch.score,3)+"</span>");

                $(nameResult).append(thisMatchResult);
                
                // highlight odd match rows
                if (j % 2 == 0)
                    thisMatchResult.attr("class","highlight");
            }
        }

        if (respData.results.length == 0) {
            $(results).append("<li class='label'>No results found for: " + queriedName + "</li>")
        }

    });
}

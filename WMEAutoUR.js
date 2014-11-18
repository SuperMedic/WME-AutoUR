// ==UserScript==
// @name        WME AutoUR
// @namespace   com.supermedic.wmeautour
// @description Autofill UR comment boxes with user defined canned messages
// @include     https://www.waze.com/editor/*
// @include     https://www.waze.com/*editor/*
// @include     https://editor-beta.waze.com/*editor/*
// @version     0.7.5
// @grant       none
// @match       https://editor-beta.waze.com/*editor/*
// @match       https://www.waze.com/*editor/*
// @downloadURL https://greasyfork.org/scripts/6508-wme-autour/code/WME%20AutoUR.user.js
// ==/UserScript==


/* Changelog
 * 0.7.5 - added @downloadURL
 * 0.7.4 - Updated webpage includes where script is run
 * 0.7.3 - Updated @since comments
 * 0.7.2 - Added title, dev info, and added to GitHub
 * 0.7.1 - Create default settings for new install
 * 0.6.1 - Create dropdown for choosing message to insert/edit
 * 0.6.0 - Update changeMessage to allow access by ID/reference
 * 0.5.0 - Allow changes to user UR messages to be injected
 * 0.4.2 - Load user settings
 * 0.4.1 - Save user settings
 * 0.4.0 - Access user settings
 * 0.3.1 - Create toolbar pannel
 * 0.3.0 - Inject comments into UR textarea
 * 0.2.0 - Display UR info, update on change
 * 0.1.4 - UI draggable
 * 0.1.3 - Limit prev/next movement by UR array count
 * 0.1.2 - ##########
 * 0.1.1 - Move map when switching, centering on current UR, zoom level 3
 * 0.1.0 - Switch between URs
 * 0.0.2 - Initial UI
 * 0.0.1 - Initial version, loading and displaying through console.info()
 */

function wme_auto_ur_bootstrap() {
  console.info("WME-AutoUR: starting (bootstrap)");
	var bGreasemonkeyServiceDefined     = false;

	try {
		if ("object" === typeof Components.interfaces.gmIGreasemonkeyService) {
			bGreasemonkeyServiceDefined = true;
		}
	}
	catch (err) {
		//Ignore.
	}
	if ( "undefined" === typeof unsafeWindow  ||  ! bGreasemonkeyServiceDefined) {
		unsafeWindow    = ( function () {
			var dummyElem   = document.createElement('p');
			dummyElem.setAttribute ('onclick', 'return window;');
			return dummyElem.onclick ();
		} ) ();
	}
	/* begin running the code! */


	WMEAutoUR_init();
}

//--------------------------------------------------------------------------------------------------------------------------------------------


/**
 *@since version 0.0.1
 */
function WMEAutoUR_init() {
    console.info("WME-AutoUR: starting (init)");
    WMEAutoUR =  {
        last: new Array(),
        isLast: false,
        isLSsupported: false,
        zoom: false
    };

//--------------------------------------------------------------------------------------------------------------------------------------------

WMEAutoUR.version = '0.7.5';


// Feature detect + local reference
/**
 *@since version 0.4.0
 */
var AURstorage,
    fail,
    uid;
try {
  uid = new Date;
  (AURstorage = window.localStorage).setItem(uid, uid);
  fail = AURstorage.getItem(uid) != uid;
  AURstorage.removeItem(uid);
  fail && (AURstorage = false);
} catch(e) {}


		// --- Setup Storage --- //
		//AURstorage;


		/**
		 *@since version 0.0.1
		 */
		WMEAutoUR.init = function() {

			// --- Setup Options --- //
			WMEAutoUR.options = {};

			// --- Load Settings --- //
			WMEAutoUR.loadSettings();

			// --- Setup Defaults --- //
			var names = [];
			names[6] = "Incorrect turn";
			names[7] = "Incorrect address";
			names[8] = "Incorrect route";
			names[9] = "Missing roundabout";
			names[10] = "General error";
			names[11] = "Turn not allowed";
			names[12] = "Incorrect junction";
			names[13] = "Missing bridge overpass";
			names[14] = "Wrong driving direction";
			names[15] = "Missing exit";
			names[16] = "Missing road";

			// --- Load Defaults --- //
			if(!WMEAutoUR.options['names']) {
				WMEAutoUR.options['names'] = names;
			}
			if(!WMEAutoUR.options['messages']) {
				WMEAutoUR.options['messages'] = names;
			}

			console.info("WME-AutoUR: starting (init.init)");
			//add the buttons to the chat title bar to hide/show user list and max and min
			if ($("#WME_AutoUR_main").length==0) {

// ---------- MAIN DIV --------- //
				WMEAutoUR.MainDIV = $('<div>').css("background","rgba(117, 79, 150, 0.85)");
				$(WMEAutoUR.MainDIV).attr("id","WME_AutoUR_main");
				//$(WMEAutoUR.MainDIV).css("padding","10px");
				$(WMEAutoUR.MainDIV).css("color","#FFFFFF");
				$(WMEAutoUR.MainDIV).css("border-radius","10px");
				$(WMEAutoUR.MainDIV).css("z-index","1000");
				$(WMEAutoUR.MainDIV).css("position","absolute");
				$(WMEAutoUR.MainDIV).css("display","block");
				$("#panels-container").append(WMEAutoUR.MainDIV);

				WMEAutoUR.MainDIV_left = $('<div>').addClass('WME_AutoUR_main_left')
													.css("padding","10px")
													.css("float","left");
				$(WMEAutoUR.MainDIV).append(WMEAutoUR.MainDIV_left);
				WMEAutoUR.MainDIV_right = $('<div>').addClass('WME_AutoUR_main_right')
													.css("padding","10px")
													.css("width","228px")
													.css("text-align","center")
													.css("float","right");
				$(WMEAutoUR.MainDIV).append(WMEAutoUR.MainDIV_right);

// ------- MAIN DIV LEFT  ------- //
				$(WMEAutoUR.MainDIV_left).append($("<div>")
										.css("width","100%")
										.css("text-align","center")
										.css("background-color","#000000")
										.css("border-radius","5px")
										.css("padding","3px")
										.css("margin-bottom","3px")
										.html("WME-AutoUR " + WMEAutoUR.version)
										.dblclick(WMEAutoUR.showDevInfo)
										.attr("title","Click for Development Info"));
				$(WMEAutoUR.MainDIV_left).append($("<button>Prev</button>")
										.click(WMEAutoUR.prevUR)
										.attr("title","Previous UR"));
				$(WMEAutoUR.MainDIV_left).append($("<button>Next</button>")
										.click(WMEAutoUR.nextUR)
										.attr("title","Next UR"));
				$(WMEAutoUR.MainDIV_left).append($("<button>Tools</button>")
										.click(WMEAutoUR.showHideTools)
										.attr("title","Show/Hide Tools Pannel"));

				$(WMEAutoUR.MainDIV_left).append($("<span id='WME_AutoUR_Info'>")
											//.css("float","right")
											.css("text-align","left")
											.css("display","block")
											.css("clear","both"));

				$(WMEAutoUR.MainDIV_left).append($("<span id='WME_AutoUR_Count'>")
											.css("text-align","right")
											.css("display","block")
											.css("clear","both")
											.css("float","right")
											.css("padding","3px")
											.css("background-color","#000000")
											.css("border-radius","5px")
											.dblclick(WMEAutoUR.getIDs)
											.attr("title","Double click to reload list of URs")
											);

// ------- MAIN DIV RIGHT  ------- //
				$(WMEAutoUR.MainDIV_right).append($("<button>Insert</button>")
										.click(WMEAutoUR.insertComment)
										.css("float","left")
										.attr("title","Insert Comment"));

				$(WMEAutoUR.MainDIV_right).append($("<button>Save This</button>")
										.click(WMEAutoUR.saveMessage)
										.attr("title","Save Current Comment"));

				$(WMEAutoUR.MainDIV_right).append($("<button>Save All</button>")
										.click(WMEAutoUR.saveSettings)
										//.css("clear","both")
										.css("float","right")
										//.css("margin-top","5px")
										.attr("title","Save All Comments/Settings"));

				$(WMEAutoUR.MainDIV_right).append($("<textarea>")
										.attr("id","WME_AutoUR_MSG_default_comment")
										.css("width","100%")
										.css("height","150px")
										.attr("title","Default Comment"));

				$(WMEAutoUR.MainDIV_right).append($("<select>")
										.attr("id","WME_AutoUR_MSG_Select")
										.attr("title","Select Message")
										.css("width","100%")
										.change(WMEAutoUR.changeMessage)
										.append("<option>-----</option>"));
				WMEAutoUR.createMsgSelect();
				WMEAutoUR.index = 0;

// ------- MAIN DIV CSS  ------- //
				//var WME_AutoUR_main_right_css = '.WME_AutoUR_main_right > * { clear: both; display: block; }';
				//$(WMEAutoUR.MainDIV).append($('<style>')
				//							.append(WME_AutoUR_main_right_css));


				//$(WMEEditOverlayMainDIV).append($('<svg id="OpenLayers.Layer.Vector.RootContainer_336_svgRoot" style="display: block;" width="1339" height="309" viewBox="0 0 1339 309"></svg>').append(WMEEditOverlay.createPolyline));
				//$(WMEEditOverlayMainDIV).append(WMEEditOverlay.createPolyline);

				console.info("WME-AutoUR: Loaded Pannel");
			}

			WMEAutoUR.getIDs();

			//--- Drag me Bishes!! ---//
			$( "#WME_AutoUR_main" ).draggable();
			$( document ).tooltip();


// MAP VIEW SIZE
/*
			var WMEAutoURViewport = Waze.map.getExtent();
			var WMEAutoURViewTop = WMEAutoURViewport.top;
			var WMEAutoURViewBottom = WMEAutoURViewport.bottom;
			var WMEAutoURViewLeft = WMEAutoURViewport.left;
			var WMEAutoURViewRight = WMEAutoURViewport.right;
*/

		}

//--------------------------------------------------------------------------------------------------------------------------------------------


		/**
		 *@since version 0.0.1
		 */
		WMEAutoUR.transformCoords = function(coords) {
			console.info("WME-AutoUR: transformCoords");
			return coords.transform(new OpenLayers.Projection("EPSG:900913"),new OpenLayers.Projection("EPSG:4326"));
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		WMEAutoUR.gotoURByIndex = function(URindex) {
			WMEAutoUR.curURid = WMEAutoUR.UR_IDs[URindex];
			WMEAutoUR.gotoURById(WMEAutoUR.curURid);
			return;
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		WMEAutoUR.gotoURById = function(URId) {
			Waze.updateRequestsControl.selectById(URId);
			var x = Waze.updateRequestsControl.currentRequest.attributes.geometry.x;
			var y = Waze.updateRequestsControl.currentRequest.attributes.geometry.y;
			Waze.map.setCenter([x,y],3);
			WMEAutoUR.getInfo();
			WMEAutoUR.changeMessage(Waze.updateRequestsControl.currentRequest.attributes.type);
			$('span[id="WME_AutoUR_Count"]').html((WMEAutoUR.index+1)+"/"+WMEAutoUR.UR_len);
			return;
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		WMEAutoUR.getIDs = function() {
			console.info("WME-AutoUR: Getting UR IDs");
			WMEAutoUR.UR_Objs = Waze.model.updateRequestSessions.objects;
			WMEAutoUR.UR_IDs = [];
			WMEAutoUR.UR_len = 0;
			for(var e in WMEAutoUR.UR_Objs) {
				//console.info(e);
				WMEAutoUR.UR_IDs.push(e);
				WMEAutoUR.UR_len++;
			}
			console.info("WME-AutoUR: WMEAutoUR.UR_len:"+WMEAutoUR.UR_len);
			console.info("WME-AutoUR: WMEAutoUR.UR_IDs:"+WMEAutoUR.UR_IDs);
			console.info("WME-AutoUR: WMEAutoUR.UR_Objs:"+WMEAutoUR.UR_Objs);
			WMEAutoUR.index = 0;
			console.info("WME-AutoUR: WMEAutoUR.index:"+WMEAutoUR.index);
			$('span[id="WME_AutoUR_Count"]').html((WMEAutoUR.index+1)+"/"+WMEAutoUR.UR_len)
			console.info('WME-AutoUR: Count Displayed');
			WMEAutoUR.firstUR();
			return;
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		WMEAutoUR.firstUR = function() {
			WMEAutoUR.gotoURByIndex(WMEAutoUR.index);
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		WMEAutoUR.nextUR = function() {
			console.info('WME-AutoUR: nextUR');
			if((WMEAutoUR.index+1) < WMEAutoUR.UR_len) {
				WMEAutoUR.gotoURByIndex(++WMEAutoUR.index);
			}
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		WMEAutoUR.prevUR = function() {
			console.info('WME-AutoUR: prevUR');
			if(WMEAutoUR.index > 0) {
				WMEAutoUR.gotoURByIndex(--WMEAutoUR.index);
			}
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.2.0
		 */
		WMEAutoUR.getInfo = function() {
			console.info('WME-AutoUR: UR Info');

			var now_time = new Date().getTime(); // (error number)
			var error_num = Waze.updateRequestsControl.currentRequest.attributes.type; // (error number)
			var error_txt = Waze.updateRequestsControl.currentRequest.attributes.typeText; // (error text)
			var error_comments = Waze.updateRequestsControl.currentRequest.attributes.hasComments; // (are there comments?)
			var error_x = Waze.updateRequestsControl.currentRequest.attributes.geometry.y; //  (y coord)
			var error_y = Waze.updateRequestsControl.currentRequest.attributes.geometry.x; //  (x coord)
			var error_drive_date_obj = new Date(Waze.updateRequestsControl.currentRequest.attributes.driveDate); //  (created usec)
			var error_update_date_obj = new Date(Waze.updateRequestsControl.currentRequest.attributes.updatedOn); //  (updated usec)
			if(Waze.updateRequestsControl.currentRequest.attributes.updatedBy) {
				var error_update_user_id = Waze.updateRequestsControl.currentRequest.attributes.updatedBy; //  (user ID)
				var error_update_user = Waze.model.users.get(error_update_user_id).userName; //  (user ID)
			} else {
				var error_update_user_id = '-1'; //  (user ID)
				var error_update_user = 'Reporter'; //  (user ID)
			}


			var info_txt = '';
			info_txt = info_txt+"Error: "+error_txt+" ("+error_num+")<br>";
			//info_txt = info_txt+"Comment: "+error_comments+"<br>";
			//info_txt = info_txt+"X: "+error_x+"<br>";
			//info_txt = info_txt+"Y: "+error_y+"<br>";

			var error_update_date = Math.floor(((((now_time - error_update_date_obj.getTime())/1000)/60)/60)/24) + " days (" + error_update_date_obj.toLocaleString() +  ")";
			var error_drive_date = Math.floor(((((now_time - error_drive_date_obj.getTime())/1000)/60)/60)/24) + " days (" + error_drive_date_obj.toLocaleString() +  ")";

			info_txt = info_txt+"Created: "+error_drive_date+"<br>";
			info_txt = info_txt+"Update: "+error_update_date+"<br>";
			info_txt = info_txt+"User: "+error_update_user+"<br>";
			//info_txt = info_txt+"UserID: "+error_update_user_id+"<br>";

			$('span[id="WME_AutoUR_Info"]').html(info_txt);
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.3.0
		 */
		WMEAutoUR.insertComment = function() {
			console.info("WME-AutoUR: Insert Comment");
			$('#update-request-panel textarea').html($("#WME_AutoUR_MSG_default_comment").val());
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.3.1
		 */
		WMEAutoUR.showHideTools = function() {
			console.info("WME-AutoUR: Show/Hide Tools");
			switch($("#WME_AutoUR_main .WME_AutoUR_main_right").css("display")) {
				case 'none': 	$("#WME_AutoUR_main .WME_AutoUR_main_right").css("display","block");	break;
				case 'block':	$("#WME_AutoUR_main .WME_AutoUR_main_right").css("display","none");		break;
				default:		$("#WME_AutoUR_main .WME_AutoUR_main_right").css("display","block");	break;
			}
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.4.1
		 */
		WMEAutoUR.saveSettings = function() {
			console.info("WME-AutoUR: Save Settings");

			console.info("WME-AutoUR: " + JSON.stringify(WMEAutoUR.options));
			AURstorage.setItem('WME_AutoUR', JSON.stringify(WMEAutoUR.options));
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.4.2
		 */
		WMEAutoUR.loadSettings = function() {
			console.info("WME-AutoUR: Load Settings");
			WMEAutoUR.options = JSON.parse(AURstorage.getItem('WME_AutoUR'));
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.5.0
		 */
		WMEAutoUR.saveMessage = function() {
			console.info("WME-AutoUR: Set Message: " + $("#WME_AutoUR_MSG_default_comment").val());
			WMEAutoUR.options['messages'][$("#WME_AutoUR_MSG_Select").val()] = $("#WME_AutoUR_MSG_default_comment").val();
			console.info("WME-AutoUR: " + JSON.stringify(WMEAutoUR.options));
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.5.0
		 */
		WMEAutoUR.changeMessage = function() {
			console.info("WME-AutoUR: changeMessage");
			//console.info("WME-AutoUR: " + arguments);
			//console.info("WME-AutoUR: " + arguments.length);
			//console.info("WME-AutoUR: " + arguments[0]);
			//console.info("WME-AutoUR: " + (arguments.length == 1));
			//console.info("WME-AutoUR: " + (typeof arguments[0] == "number"));

			var index;
			if((arguments.length == 1) && (typeof arguments[0] == "number")) {
				console.info("WME-AutoUR: arguments");
				index = arguments[0];
				$('#WME_AutoUR_MSG_Select').val(index);
			} else {
				index = $(this).val();
			}
			if(index == null) {
				index = $("#WME_AutoUR_MSG_Select").val();
			}
			console.info("WME-AutoUR: Change Message: " + WMEAutoUR.options['messages'][index]);
			$("#WME_AutoUR_MSG_default_comment").val(WMEAutoUR.options['messages'][index]);

			try {
				if($("#update-request-panel textarea").length!=0) {
					console.info("WME-AutoUR check textarea != 0");
					WMEAutoUR.insertComment();
				} else {
					console.info("WME-AutoUR check textarea == 0");
					setTimeout(WMEAutoUR.insertComment, 1000);
				}
			} catch(err) {
				console.info("WME-AutoUR: Error:"+err);
			}
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.6.1
		 */
		WMEAutoUR.createMsgSelect = function() {
			console.info("WME-AutoUR: Create Select");

			$.each(WMEAutoUR.options['names'],function(i,v) {
				if(v) {
					var opt = $('<option>')
					$(opt).attr('value',i);
					$(opt).html(v);
					$("#WME_AutoUR_MSG_Select").append(opt);
					//console.info(v);
				}
			});
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.7.2
		 */
		WMEAutoUR.showDevInfo = function() {
			var info_txt = '';
			info_txt = info_txt + 'Created by: <b>SuperMedic</b><br>';
			info_txt = info_txt + 'Beta Testers:<br>';
			info_txt = info_txt + '<b>Stephenr1966</b><br>';
			$('span[id="WME_AutoUR_Info"]').html(info_txt);
		}

//--------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.0.1
		 */
		WMEAutoUR.startcode = function () {
			console.info("WME-AutoUR: startcode");
			// Check if WME is loaded, if not, waiting a moment and checks again. if yes init WMEChatResize
			try {
				//if ("undefined" != typeof unsafeWindow.W.model.chat.rooms._events.listeners.add[0].obj.userPresenters[unsafeWindow.Waze.model.loginManager.user.id] ) {
				if ("undefined" != typeof Waze.map ) {
					console.info("WME-AutoUR ready to go");
					WMEAutoUR.init()
				} else {
					console.info("WME-AutoUR: waiting for WME to load...");
					setTimeout(WMEAutoUR.startcode, 1000);
				}
			} catch(err) {
				console.info("WME-AutoUR: waiting for WME to load...(caught in an error)");
				console.info("WME-AutoUR: Error:"+err);
				setTimeout(WMEAutoUR.startcode, 1000);
			}
		}

//--------------------------------------------------------------------------------------------------------------------------------------------

		//setTimeout(WMEChatResize.startcode, 5000);
		WMEAutoUR.startcode();

}

//--------------------------------------------------------------------------------------------------------------------------------------------

// then at the end of your script, call the bootstrap to get things started
wme_auto_ur_bootstrap();
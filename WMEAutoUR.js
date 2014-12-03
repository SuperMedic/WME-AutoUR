// ==UserScript==
// @name        WME AutoUR
// @namespace   com.supermedic.wmeautour
// @description Autofill UR comment boxes with user defined canned messages
// @version     0.12.1
// @grant       none
// @match       https://editor-beta.waze.com/*editor/*
// @match       https://www.waze.com/*editor/*
// @match       https://www.waze.com/editor/*
// ==/UserScript==


/* Changelog
 * 0.12.1 - Confined Auto selection to screen, enabled Initial/Stale/Dead/None filters
 * 0.12.0 - Merged UI from branch, Updated Dev info, Created default messages
 * 0.11.2 - UI fix FF
 * 0.11.1 - Background proccesses now stop when AutoUR is minimized
 * 0.11.0 - Added tabbed interface
 * 0.10.0 - Added toggle button for floating UI
 * 0.9.6a - Fixed auto count update issue
 * 0.9.6 - Moved Auto Buttons to bottom
 * 0.9.5 - Code clairity rewrite
 * 0.9.0 - Added support for manually choosing UR
 * 0.8.3 - Organized code
 * 0.8.2 - Removed auto UR find
 * 0.8.1 - Cleaned up INIT code
 * 0.8.0 - Added Google Chrome support
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
	WMEAutoUR_Create();
}

//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------------  WMEAutoUR FUNCTIONS  -----------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
/**
 *@since version 0.10.0
 */
function WMEAutoUR_Create() {
	WMEAutoUR = {};
	WMEAutoUR.version = '0.12.1';
	WMEAutoUR.logPrefix = 'WMEAutoUR';

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------
	//-------------  ##########  START CODE FUNCTION ##########  ---------------------------------------------------------------------------------
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
				console.info("WME-AutoUR: ready to go");
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
	//--------------------------------------------------------------------------------------------------------------------------------------------
	//-------------  ##########  START CODE FUNCTION ##########  ---------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.0.1
	 */
	WMEAutoUR.init = function() {
		// --- Setup Options --- //
		WMEAutoUR.options = {};
		// --- Setup Intervals --- //
		WMEAutoUR.Intervals = {};
		// --- Load Settings --- //
		WMEAutoUR.Settings.Load();
		console.info("WME-AutoUR: starting (init)");
		// --- Create Floating UI --- //
		//WMEAutoUR_Create_FloatUI();
		// --- Create Floating UI --- //
		WMEAutoUR_Create_TabbedUI();
	// @since 0.8.2 - Turned off auto UR finding
		WMEAutoUR.Auto.index = 0;
		WMEAutoUR.Intervals.getActive = window.setInterval(WMEAutoUR.UR.getActive,250);
		WMEAutoUR.Intervals.SaveSettings = window.setInterval(WMEAutoUR.Settings.Save,30000);
		WMEAutoUR.showDevInfo();
		$(document).tooltip();
	}


	//--------------------------------------------------------------------------------------------------------------------------------------------
	//----------------------  MANUAL UR FUNCTIONS  -----------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since 0.10.0
	 */
	WMEAutoUR.UR = {


		/**
		 *@since version 0.9.0
		 */
		getActive: function() {
			console.info("WME-AutoUR getActive");
			if(Waze.updateRequestsControl.currentRequest) {
				var urID = Waze.updateRequestsControl.currentRequest.attributes.id;
				if((WMEAutoUR.activeUR != urID)) {
					WMEAutoUR.activeUR = urID;
					$('span[id="WME_AutoUR_Info"]').html(WMEAutoUR.UR.getInfo());
					WMEAutoUR.Messages.Change(Waze.updateRequestsControl.currentRequest.attributes.type);
				}
			}
		},

		/**
		 *@since version 0.2.0
		 */
		getInfo: function() {

			var error_update_user_id = '-1'; //  (user ID)
			var error_update_user = 'Reporter'; //  (user ID)

			var now_time = new Date().getTime(); // (error number)
			var error_id = Waze.updateRequestsControl.currentRequest.attributes.id; // (id)
			var error_num = Waze.updateRequestsControl.currentRequest.attributes.type; // (error number)
			var error_txt = Waze.updateRequestsControl.currentRequest.attributes.typeText; // (error text)
			var error_comments = Waze.updateRequestsControl.currentRequest.attributes.hasComments; // (are there comments?)
			var error_x = Waze.updateRequestsControl.currentRequest.attributes.geometry.y; //  (y coord)
			var error_y = Waze.updateRequestsControl.currentRequest.attributes.geometry.x; //  (x coord)
			var error_drive_date_obj = new Date(Waze.updateRequestsControl.currentRequest.attributes.driveDate); //  (created usec)
			var error_update_date_obj = new Date(Waze.updateRequestsControl.currentRequest.attributes.updatedOn); //  (updated usec)
			if(Waze.updateRequestsControl.currentRequest.attributes.updatedBy) {
				error_update_user_id = Waze.updateRequestsControl.currentRequest.attributes.updatedBy; //  (user ID)
				error_update_user = Waze.model.users.get(error_update_user_id).userName; //  (user ID)
			} else {
				error_update_user_id = '-1'; //  (user ID)
				error_update_user = 'Reporter'; //  (user ID)
			}


			var info_txt = '';
			info_txt = info_txt+"<b>Error:</b> "+error_txt+" ("+error_num+")<br>";
			//info_txt = info_txt+"Comment: "+error_comments+"<br>";
			//info_txt = info_txt+"X: "+error_x+"<br>";
			//info_txt = info_txt+"Y: "+error_y+"<br>";

			var error_update_date = Math.floor(((((now_time - error_update_date_obj.getTime())/1000)/60)/60)/24) + " days ago";
			var error_drive_date = Math.floor(((((now_time - error_drive_date_obj.getTime())/1000)/60)/60)/24) + " days ago";

			info_txt = info_txt+"<b>Created:</b> "+error_drive_date+"<br>";
			info_txt = info_txt+"<b>Updated:</b> "+error_update_date+"<br>";
			info_txt = info_txt+"<b>By:</b> "+error_update_user+"<br>";
			info_txt = info_txt+"<b>URID:</b> "+error_id+"<br>";

			//$('span[id="WME_AutoUR_Info"]').html(info_txt);
			return info_txt;
		}
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//----------------------  END MANUAL UR FUNCTIONS  -------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//----------------------  AUTO UR FUNCTIONS  -------------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------
	WMEAutoUR.Auto = {

		/**
		 *@since version 0.1.0
		 */
		getIDs: function() {
			//console.info("WME-AutoUR: Getting UR IDs");
			//WMEAutoUR.Auto.UR_Objs = Waze.model.mapUpdateRequests.objects;
			//WMEAutoUR.Auto.UR_IDs = [];
			//WMEAutoUR.Auto.UR_len = 0;
			//WMEAutoUR.Auto.index = 0;
			//for(var e in WMEAutoUR.Auto.UR_Objs) {
			//	WMEAutoUR.Auto.UR_IDs.push(e);
			//	WMEAutoUR.Auto.UR_len++;
			//}
			//WMEAutoUR.Auto.index = 0;
			//$('span[id="WME_AutoUR_Count"]').html((WMEAutoUR.Auto.index+1)+"/"+WMEAutoUR.Auto.UR_len)
			//WMEAutoUR.Auto.firstUR();
			//return;

			var WMEAutoURViewport = Waze.map.getExtent();
			var WMEAutoURViewTop = WMEAutoURViewport.top;
			var WMEAutoURViewBottom = WMEAutoURViewport.bottom;
			var WMEAutoURViewLeft = WMEAutoURViewport.left;
			var WMEAutoURViewRight = WMEAutoURViewport.right;

			console.info(WMEAutoUR.logPrefix+": Getting Screen IDs");
			WMEAutoUR.Auto.UR_Objs = Waze.model.mapUpdateRequests.objects;
			WMEAutoUR.Auto.UR_VIEW_IDs = []; // IDs in view
			WMEAutoUR.Auto.UR_WORK_IDs = []; // IDs after filter
			WMEAutoUR.Auto.UR_len = 0;
			WMEAutoUR.Auto.index = 0;
			for(var e in WMEAutoUR.Auto.UR_Objs) {
				var cur_obj = WMEAutoUR.Auto.UR_Objs[e];
				var cur_x = cur_obj.attributes.geometry.x;
				var cur_y = cur_obj.attributes.geometry.y;

				if((cur_x > WMEAutoURViewport.left) && (cur_x < WMEAutoURViewport.right)) {
					if((cur_y > WMEAutoURViewport.bottom) && (cur_y < WMEAutoURViewport.top)) {
						Waze.updateRequestsControl.selectById(e);
						WMEAutoUR.Auto.UR_VIEW_IDs.push(e);
						console.info(e);
					}
				}
			}
// --- WHY ARE WE WAITING HERE? --- //
			window.setTimeout(WMEAutoUR.Auto.filterURs,1500);

			WMEAutoUR.Auto.index = 0;
			return;
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.11.8RE
		 */
		filterURs: function() {
			console.info("FILTER URS");

			// --- now in usec --- //
			var now_time = new Date().getTime();

			for(var i=0; i<WMEAutoUR.Auto.UR_VIEW_IDs.length;i++) {
				console.info("urFOR");
				var cur_ur_id = WMEAutoUR.Auto.UR_VIEW_IDs[i];
				var cur_ur_obj = WMEAutoUR.Auto.UR_Objs[cur_ur_id];
				Waze.updateRequestsControl.selectById(cur_ur_id);
				// --- NO FILTER --- //
				if($("#WME_AutoUR_Filter_button").val() == '2') {
					WMEAutoUR.Auto.UR_len++;
					WMEAutoUR.Auto.UR_WORK_IDs.push(cur_ur_id);
					continue;
				}
				// --- CHECK SPECIAL --- //
				if(WMEAutoUR.Auto.specialRejects(cur_ur_id)) continue;
				if(WMEAutoUR.Auto.reporterComments(cur_ur_id)) continue;
				// --- INITIAL COMMENT --- //
				if($("#WME_AutoUR_Filter_button").val() == '-1') {
					if(!cur_ur_obj.attributes.hasComments) {
						WMEAutoUR.Auto.UR_len++;
						WMEAutoUR.Auto.UR_WORK_IDs.push(cur_ur_id);
						continue;
					}
				}
				//// === SET UP TIMES === ////
				// --- created in usec --- //
				var drive_date_obj = new Date(Waze.updateRequestsControl.currentRequest.attributes.driveDate);
				// --- created in days --- //
				var drive_date = Math.floor(((((now_time - drive_date_obj.getTime())/1000)/60)/60)/24);
				// --- updated (commented) in usec --- //
				var update_date_obj = new Date(Waze.updateRequestsControl.currentRequest.attributes.updatedOn);
				// --- updated (commented) in days --- //
				var update_date = Math.floor(((((now_time - update_date_obj.getTime())/1000)/60)/60)/24);


				  // --- STALE 1 COMMENT --- //
				if($("#WME_AutoUR_Filter_button").val() == '0') {
					if(wazeModel.updateRequestSessions.objects[cur_ur_id].comments.length == 1) {
						if((drive_date > WMEAutoUR.options.stale[1].Days) && (update_date > WMEAutoUR.options.stale[1].Days)) {
							WMEAutoUR.Auto.UR_len++;
							WMEAutoUR.Auto.UR_WORK_IDs.push(cur_ur_id);
						}
					}
				}
				  // --- STALE 2 COMMENT --- //
				if($("#WME_AutoUR_Filter_button").val() == '1') {
					if(wazeModel.updateRequestSessions.objects[cur_ur_id].comments.length >= 2) {
						console.info(drive_date + " : " + update_date);
						if((drive_date >= WMEAutoUR.options.stale[2].Days) && (update_date >= WMEAutoUR.options.stale[2].Days)) {
							WMEAutoUR.Auto.UR_len++;
							WMEAutoUR.Auto.UR_WORK_IDs.push(cur_ur_id);
						}
					}
				}
			}
			console.info(WMEAutoUR.Auto.UR_WORK_IDs);

			//$('span[id="WMEAutoUR_URs_selected"]').html(WMEAutoUR.Auto.UR_len + " URs selected");
			if(WMEAutoUR.Auto.UR_len) {
				$('span[id="WME_AutoUR_Count"]').html((WMEAutoUR.Auto.index+1)+"/"+WMEAutoUR.Auto.UR_len);
			} else {
				$('span[id="WME_AutoUR_Count"]').html("0/0");
			}

			window.setTimeout(WMEAutoUR.Messages.Close,750);
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.11.16RE
		 */
		specialRejects: function(urID) {
			//var exp = /^\[([a-zA-Z]*)\]/;
			var ur_desc = Waze.model.mapUpdateRequests.objects[urID].attributes.description;
			if(ur_desc) {
				if(ur_desc.match(/^\[.*\]/)) {
					switch(ur_desc.match(/^\[([a-zA-Z]*)\]/)[1]) {
						case 'ROADWORKS':
						case 'CONSTRUCTION':
						case 'CLOSURE':
						case 'EVENT':
						case 'NOTE':		return true;	break;
						default:		return false;	break;
					}
				}
			}
			return false;
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.11.17RE
		 */
		reporterComments: function(urID) {
			var reporter_comment = wazeModel.updateRequestSessions.objects[urID].comments;
			for(var i=0;i<reporter_comment.length;i++) {
				if(!reporter_comment[i].userID) {
					console.info("true");
					return true;
				}
			}
			console.info("false");
			return false;
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		firstUR: function() {
			WMEAutoUR.Auto.gotoURByIndex(WMEAutoUR.Auto.index);
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		Next: function() {
			if((WMEAutoUR.Auto.index+1) < WMEAutoUR.Auto.UR_len) {
				WMEAutoUR.Auto.gotoURByIndex(++WMEAutoUR.Auto.index);
			}
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		Prev: function() {
			console.info('WME-AutoUR: prevUR');
			if(WMEAutoUR.Auto.index > 0) {
				WMEAutoUR.Auto.gotoURByIndex(--WMEAutoUR.Auto.index);
			}
		},
		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		gotoURByIndex: function(URindex) {
			WMEAutoUR.Auto.curURid = WMEAutoUR.Auto.UR_WORK_IDs[URindex];
			WMEAutoUR.Auto.gotoURById(WMEAutoUR.Auto.curURid);
			return;
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		gotoURById: function(URId) {
			$('span[id="WME_AutoUR_Count"]').html((WMEAutoUR.Auto.index+1)+"/"+WMEAutoUR.Auto.UR_len);
			Waze.updateRequestsControl.selectById(URId);
			var x = Waze.updateRequestsControl.currentRequest.attributes.geometry.x;
			var y = Waze.updateRequestsControl.currentRequest.attributes.geometry.y;
			Waze.map.setCenter([x,y],3);
			WMEAutoUR.UR.getInfo();
			WMEAutoUR.changeMessage(Waze.updateRequestsControl.currentRequest.attributes.type);
			return;
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.1.0
		 */
		filterButton: function(e) {
			switch($("#WME_AutoUR_Filter_button").val()) {
				case '2':		$("#WME_AutoUR_Filter_button").val(-1)
															  .css("background-color","Green")
															  .css("color","White")
															  .html("Initial");	break;
				case '0':		$("#WME_AutoUR_Filter_button").val(1)
															  .css("background-color","Red")
															  .css("color","black")
															  .html("Dead");	break;
				case '-1':		$("#WME_AutoUR_Filter_button").val(0)
															  .css("background-color","Yellow")
															  .css("color","black")
															  .html("Stale");	break;
				case '1':
				default:		$("#WME_AutoUR_Filter_button").val(2)
															  .css("background-color","White")
															  .css("color","Black")
															  .html("None");	break;
			}

			return;
		}
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//----------------------  END AUTO UR FUNCTIONS  ---------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//----------------------  STORAGE/SETTINGS/MESSAGES FUNCTIONS  -------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since 0.10.0
	 */
	WMEAutoUR.Settings = {

		/**
		 *@since version 0.4.1
		 */
		Save: function() {
			console.info("WME-AutoUR: Save Settings");

			localStorage.setItem('WME_AutoUR', JSON.stringify(WMEAutoUR.options));
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.4.2
		 */
		Load: function() {

			console.info("WME-AutoUR: Load Settings");
			var newOpts;
			var savedOpt = localStorage.WME_AutoUR;
			if(savedOpt) {
				newOpts = JSON.parse(localStorage.WME_AutoUR);
			}

			if(newOpts != null) {
				WMEAutoUR.options = newOpts;
			}
			console.info("WME-AutoUR: Load Settings");

			// --- Load Defaults --- //
			var field = 0;
			try {
			  console.info(WMEAutoUR.options.names[6]);
			} catch(e) {
				field += 1;
			}
			try {
			  console.info(WMEAutoUR.options.messages[6]);
			} catch(e) {
				field += 2;
			}
			try {
			  console.info(WMEAutoUR.options.stale[1].Days);
			} catch(e) {
				field += 4;
			}

			WMEAutoUR.Settings.Reset(field);

			console.info("WME-AutoUR: checking defaults... done");
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.4.2
		 */
		Reset: function() {
			console.info("WME-AutoUR: RESET");
			// --- Setup Defaults --- //
			var def_names = [];
			def_names[6] = "Incorrect turn";
			def_names[7] = "Incorrect address";
			def_names[8] = "Incorrect route";
			def_names[9] = "Missing roundabout";
			def_names[10] = "General error";
			def_names[11] = "Turn not allowed";
			def_names[12] = "Incorrect junction";
			def_names[13] = "Missing bridge overpass";
			def_names[14] = "Wrong driving direction";
			def_names[15] = "Missing Exit";
			def_names[16] = "Missing Road";
			def_names[18] = "Missing Landmark";
			def_names[19] = "Blocked Road";
			def_names[21] = "Missing Street Name";
			def_names[22] = "Incorrect Street Prefix or Suffix";

			// --- Thank you RickZAbel --- //
			var def_messages = [];
			$.each(def_names, function(k,v) {
				def_messages[k] = "Thank you for your report! Can you please give me more information about the " + v + " you reported?";
			})


			var def_staleMsgs = [];
			def_staleMsgs[1] = {"Days":2,"Comment":"Stale 1"};
			def_staleMsgs[2] = {"Days":4,"Comment":"Stale 2"};

			// --- Load Defaults --- //
			if((typeof(arguments[0]) == 'number')) {
				var field = arguments[0];
				if(field >= 4) {
					WMEAutoUR.options.stale = def_staleMsgs;
					field -= 4;
				}
				if(field >= 2) {
					WMEAutoUR.options.messages = def_messages;
					field -= 2;
				}
				if(field == 1) {
					WMEAutoUR.options.names = def_names;
					field -= 1;
				}
			} else {
				WMEAutoUR.options.names = def_names;
				WMEAutoUR.options.messages = def_messages;
				WMEAutoUR.options.stale = def_staleMsgs;
			}

			WMEAutoUR.Settings.Save();

		}
	};

	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since 0.10.0
	 */
	WMEAutoUR.Messages = {
		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.5.0
		 */
		Save: function() {
			WMEAutoUR.options.messages[$("#WMEAutoUR_Inital_Select").val()] = $("#WMEAutoUR_Inital_Comment").val();
			WMEAutoUR.Settings.Save();
		},

		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.5.0
		 */
		Change: function() {

			var index;
			if((arguments.length == 1) && (typeof arguments[0] == "number")) {
				index = arguments[0];
				$('#WMEAutoUR_Inital_Select').val(index);
			} else {
				index = $(this).val();
			}
			if(index == null) {
				index = $("#WMEAutoUR_Inital_Select").val();
			}
			$("#WMEAutoUR_Inital_Comment").val(WMEAutoUR.options.messages[index]);
			$("#WME_AutoUR_MSG_Display").html(WMEAutoUR.options.messages[index]);

			try {
				if($("#update-request-panel textarea").length!=0) {
					WMEAutoUR.Messages.Insert();
				} else {
					setTimeout(WMEAutoUR.Messages.Insert, 1000);
				}
			} catch(err) {
				console.info("WME-AutoUR: Error:"+err);
			}

		},


		//--------------------------------------------------------------------------------------------------------------------------------------------
		/**
		 *@since version 0.3.0
		 */
		Insert: function() {
			console.info("WME-AutoUR: Change");
			  // --- INITIAL COMMENT --- //
			//if($('#UR_type--1').is(':checked')) {
				$('#update-request-panel textarea').html(WMEAutoUR.options.messages[Waze.updateRequestsControl.currentRequest.attributes.type]);
			//}
			//  // --- STALE 1 COMMENT --- //
			//if($('#UR_type-0').is(':checked')) {
			//	$('#update-request-panel textarea').html(WMEAutoUR.options.stale[1].Comment);
			//}
			//  // --- STALE 1 COMMENT --- //
			//if($('#UR_type-1').is(':checked')) {
			//	$('#update-request-panel textarea').html(WMEAutoUR.options.stale[2].Comment);
			//}
		}
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//----------------------  END STORAGE/SETTINGS?MESSAGES FUNCTIONS  ---------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------

	//--------------------------------------------------------------------------------------------------------------------------------------------
	//------------------------  OTHER FUNCTIONS  -------------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since version 0.7.2
	 */
	WMEAutoUR.showDevInfo = function() {
		var info_txt = '';
		info_txt = info_txt + 'Created by: <b>SuperMedic</b><br>';
		info_txt = info_txt + 'Beta Testers:<br>';
		info_txt = info_txt + '<b>Stephenr1966</b><br>';
		info_txt = info_txt + '<b>SeekingSerenity</b><br>';
		info_txt = info_txt + '<b>t0cableguy</b><br>';
		info_txt = info_txt + '<b>ct13</b><br>';
		info_txt = info_txt + '<b>RickZAbel</b><br>';
		$('span[id="WME_AutoUR_Info"]').html(info_txt);
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.3.1
	 */
	WMEAutoUR.showHideTools = function() {
		switch($("#WME_AutoUR_main .WME_AutoUR_main_right").css("display")) {
			case 'none': 	$("#WME_AutoUR_main .WME_AutoUR_main_right").css("display","block");	break;
			case 'block':	$("#WME_AutoUR_main .WME_AutoUR_main_right").css("display","none");		break;
			default:		$("#WME_AutoUR_main .WME_AutoUR_main_right").css("display","block");	break;
		}
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.11.0
	 */
	WMEAutoUR.off = function() {
		console.info("WME-AutoUR Stopping...");
		window.clearInterval(WMEAutoUR.Intervals.getActive);
		window.clearInterval(WMEAutoUR.Intervals.SaveSettings);
		WMEAutoUR.Settings.Save();
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.11.0
	 */
	WMEAutoUR.on = function() {
		console.info("WME-AutoUR Restarting...");
		WMEAutoUR.Intervals.getActive = window.setInterval(WMEAutoUR.UR.getActive,250);
		WMEAutoUR.Intervals.SaveSettings = window.setInterval(WMEAutoUR.Settings.Save,30000);
	}


	//--------------------------------------------------------------------------------------------------------------------------------------------
	//------------------------  END OTHER FUNCTIONS  ---------------------------------------------------------------------------------------------
	//--------------------------------------------------------------------------------------------------------------------------------------------

	WMEAutoUR.startcode();
}




//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------------  WMEAutoUR FUNCTIONS  -----------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------  Create floating UI  ------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
function WMEAutoUR_Create_FloatUI() {
	WMEAutoUR_FloatingUI = {};
	/**
	 *@since version 0.8.1
	 */
	WMEAutoUR_FloatingUI.init = function() {

		var MainDIV = WMEAutoUR_FloatingUI.MainDIV();

		$(MainDIV).append(WMEAutoUR_FloatingUI.LeftSubDIV);
		$(MainDIV).append(WMEAutoUR_FloatingUI.RightSubDIV);

		// See if the div is already created //
		if ($("#WME_AutoUR_main").length==0) {
			$("#panels-container").append(MainDIV);
			console.info("WME-WMEAutoUR_FloatingUI: Loaded Pannel");
		}

		// See if the div is already created //
		if ($("#WME_AutoUR_main_toggle").length==0) {
			WMEAutoUR_FloatingUI.MainDIVtoggle();
		}

		//--- Drag me Bishes!! ---//
		$("#WME_AutoUR_main").draggable();
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.10.0
	 */
	// ---------- MAIN DIV TOGGLE --------- //
	WMEAutoUR_FloatingUI.MainDIVtoggle = function() {
		console.info("WME-WMEAutoUR_FloatingUI: create main div toggle ");

		var MainToggle = $('<div>').attr("title","Toggle AutoUR.")
									.attr("id","WME_AutoUR_main_toggle")
									.addClass("toolbar-button")
									.css("background-image",'url("https://www.waze.com/assets-editor/images/vectors/problems/problem_pin_open-high.png")')
									.css("background-repeat","no-repeat")
									.css("background-position","center")
									.append("<span>Toggle AutoUR</span>")
									.click(WMEAutoUR_FloatingUI.hideWindow);

		$("#edit-buttons").append(MainToggle);
	}
	/**
	 *@since version 0.10.0
	 */
	// ---------- MAIN DIV TOGGLE --------- //
	WMEAutoUR_FloatingUI.hideWindow = function() {

		switch($("#WME_AutoUR_main").css("display")) {
			case 'none': 	$("#WME_AutoUR_main").css("display","block");
							WMEAutoUR.on();		break;
			case 'block':	$("#WME_AutoUR_main").css("display","none");
							WMEAutoUR.off();	break;
			default:		$("#WME_AutoUR_main").css("display","block");	break;
		}
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.8.1
	 */
	// ---------- MAIN DIV --------- //
	WMEAutoUR_FloatingUI.MainDIV = function() {

		var MainDIV = $('<div>').css("background","rgba(93, 133, 161, 0.85)");
		$(MainDIV).attr("id","WME_AutoUR_main");
		//$(WMEAutoUR.MainDIV).css("padding","10px");
		$(MainDIV).css("color","#FFFFFF");
		$(MainDIV).css("border-radius","10px");
		$(MainDIV).css("z-index","1000");
		$(MainDIV).css("position","absolute");
		$(MainDIV).css("display","block");

		return MainDIV;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.8.1
	 */
	WMEAutoUR_FloatingUI.LeftSubDIV = function() {

		MainDIV_left = $('<div>').addClass('WME_AutoUR_main_left')
								  .css("padding","10px")
								  .css("float","left");

		// ------- MAIN DIV LEFT  ------- //
		$(MainDIV_left).append($("<div>")
						.css("width","100%")
						.css("text-align","center")
						.css("background-color","#000000")
						.css("border-radius","5px")
						.css("padding","3px")
						.css("margin-bottom","3px")
						.html("WME-AutoUR " + WMEAutoUR.version)
						.dblclick(WMEAutoUR.showDevInfo)
						.attr("title","Click for Development Info"));

		$(MainDIV_left).append($("<span id='WME_AutoUR_Info'>")
						//.css("float","right")
						.css("text-align","left")
						.css("display","block")
						.css("width","275px")
						.css("height","150px")
						.css("clear","both"));

		autoBar = $('<div>').css("width","100%")
							.css("padding-top","10px");
		$(MainDIV_left).append($(autoBar));

		$(autoBar).append($("<button>Prev</button>")
						.click(WMEAutoUR.Auto.Prev)
						.css("position","relative")
						.css("float","left")
						.css("height","24px")
						.attr("title","Previous UR"));

		$(autoBar).append($("<button>Next</button>")
						.click(WMEAutoUR.Auto.Next)
						.css("position","relative")
						.css("float","right")
						.css("height","24px")
						.attr("title","Next UR"));

		$(autoBar).append($("<span id='WME_AutoUR_Count'>")
						.css("text-align","center")
						.css("display","block")
						.css("width","60px")
						.css("margin","0 auto")
						.css("padding","3px")
						.css("background-color","#000000")
						.css("border-radius","5px")
						.html("?/?")
						.dblclick(WMEAutoUR.Auto.getIDs)
						.attr("title","Double click to reload list of URs"));

		return MainDIV_left;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.8.1
	 */
	// ------- MAIN DIV RIGHT  ------- //
	WMEAutoUR_FloatingUI.RightSubDIV = function() {

		MainDIV_right = $('<div>').addClass('WME_AutoUR_main_right')
								  .css("padding","10px")
								  .css("width","275px")
								  .css("text-align","center")
								  .css("float","right");

		$(MainDIV_right).append($("<button>Insert</button>")
						.click(WMEAutoUR.Messages.Insert)
						.css("float","left")
						.attr("title","Insert Comment"));

		$(MainDIV_right).append($("<button>Send</button>")
						//.dblclick(WMEAutoUR.showHideTools)
						.attr("title","Insert message, MARK OPEN, and close UR edit window. "));

		$(MainDIV_right).append($("<button>Solve</button>")
						//.dblclick(WMEAutoUR.showHideTools)
						.attr("title","Insert message, MARK SOLVED."));

		$(MainDIV_right).append($("<button>Not ID</button>")
						//.dblclick(WMEAutoUR.showHideTools)
						.attr("title","Insert message, MARK NOT IDENTIFIED."));

		$(MainDIV_right).append($("<textarea>")
						.attr("id","WME_AutoUR_MSG_default_comment")
						.css("width","100%")
						.css("height","150px")
						.attr("title","Default Comment"));

		var select = $("<select>")
					  .attr("id","WME_AutoUR_MSG_Select")
					  .attr("title","Select Message")
					  .css("width","175px")
					  .css("float","left")
					  .change(WMEAutoUR.Messages.Change)
					  .append("<option>-----</option>");

		$(MainDIV_right).append($("<button>Save This</button>")
						.click(WMEAutoUR.Messages.Save)
						.css("float","right")
						.attr("title","Save Current Comment"));

		$(MainDIV_right).append(select);
		WMEAutoUR_FloatingUI.createSelect(select);

		return MainDIV_right;
	}

	/**
	*@since version 0.6.1
	*/
	WMEAutoUR_FloatingUI.createSelect = function(select) {

		$.each(WMEAutoUR.options.names,function(i,v) {
			if(v) {
				var opt = $('<option>')
				$(opt).attr('value',i);
				$(opt).html(v);
				$(select).append(opt);
			}
		}
		);
	}


	WMEAutoUR_FloatingUI.init();
}

//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------  END Create floating UI  --------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------  Create Tabbed UI  ------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------


function WMEAutoUR_Create_TabbedUI() {
	WMEAutoUR_TabbedUI = {};
	/**
	 *@since version 0.11.0
	 */
	WMEAutoUR_TabbedUI.init = function() {

		var ParentDIV = WMEAutoUR_TabbedUI.ParentDIV();
		$(ParentDIV).append(WMEAutoUR_TabbedUI.Title());
		//$(ParentDIV).append($('<span>').attr("id","WME_AutoUR_Info")
		//								.click(function(){$(this).html('');})
		//								.css("color","#000000"));

		$(ParentDIV).append(WMEAutoUR_TabbedUI.TabsHead());

		var TabBody = WMEAutoUR_TabbedUI.TabsBody();

		$(TabBody).append(WMEAutoUR_TabbedUI.EditorTAB);
		$(TabBody).append(WMEAutoUR_TabbedUI.MessagesTAB);
		$(TabBody).append(WMEAutoUR_TabbedUI.SettingsTAB);

		$(ParentDIV).append(TabBody);

		// See if the div is already created //
		if ($("#WME_AutoUR_TAB_main").length==0) {
			$("div.tips").after(ParentDIV);
			console.info("WME-WMEAutoUR_TabbedUI: Loaded Pannel");
		}

	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since version 0.11.0
	 */
	// ---------- MAIN DIV TOGGLE --------- //
	WMEAutoUR_TabbedUI.hideWindow = function() {

		switch($("#WME_AutoUR_TAB_main").css("height")) {
			case '30px': 	$("#WME_AutoUR_TAB_main").css("height","auto");
							$("#WMEAutoUR_TabbedUI_toggle").html("-");
							WMEAutoUR.on();		break;
			default:		$("#WME_AutoUR_TAB_main").css("height","30px");
							$("#WMEAutoUR_TabbedUI_toggle").html("+");
							WMEAutoUR.off();	break;
		}
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since version 0.11.0
	 */
	// ---------- MAIN DIV --------- //
	WMEAutoUR_TabbedUI.ParentDIV = function() {

		var MainTAB = $('<div>').attr("id","WME_AutoUR_TAB_main")
								.css("color","#FFFFFF")
								.css("border-bottom","2px solid #E9E9E9")
								.css("margin","21px 0")
								.css("padding-bottom","10px")
								.css("max-width","275px")
								//.css("width","208px")
								.css("overflow","hidden")
								.css("display","block");

		return MainTAB;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since version 0.11.0
	 */
	// ---------- MAIN DIV --------- //
	WMEAutoUR_TabbedUI.Title = function() {
		console.info("WME-WMEAutoUR_TabbedUI: create main div ");

		// ------- TITLE  ------- //
		var mainTitle = $("<div>")
						.attr("id","WME_AutoUR_TAB_title")
						.css("width","100%")
						.css("text-align","center")
						.css("background-color","rgb(93, 133, 161)")
						.css("border-radius","5px")
						.css("padding","3px")
						.css("margin-bottom","3px")
						.html("WME-AutoUR " + WMEAutoUR.version)
						.dblclick(WMEAutoUR.showDevInfo)
						.attr("title","Click for Development Info");

		$(mainTitle).append($('<div>').attr("id","WMEAutoUR_TabbedUI_toggle")
									  .html("-")
									  .css("float","right")
									  .css("position","relative")
									  .css("color","#ffffff")
									  .css("right","3px")
									  .css("top","0")
									  .css("background","#000000")
									  .css("height","16px")
									  .css("width","16px")
									  .css("display","block")
									  .css("line-height","14px")
									  .css("border-radius","5px")
									  .click(WMEAutoUR_TabbedUI.hideWindow));

		return mainTitle;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since version 0.11.0
	 */
	// ---------- MAIN DIV --------- //
	WMEAutoUR_TabbedUI.TabsHead = function() {

		// ------- TABS  ------- //
		var mainTabs = $("<div>")
						.attr("id","WME_AutoUR_TAB_head")
						.css("padding","3px")
						.css("margin-bottom","3px")
						.attr("title","Click for Development Info");
		var tabs = $("<ul>").addClass("nav")
							.addClass("nav-tabs");

		$(tabs).append($("<li>").append($("<a>").attr("data-toggle","tab")
												.attr("href","#WMEAutoUR_EDIT_TAB")
												.html("Editor")
									   ).addClass("active")
					  );

		$(tabs).append($("<li>").append($("<a>").attr("data-toggle","tab")
												.attr("href","#WMEAutoUR_MSG_TAB")
												.html("Messages")
												.addClass("active")
									   )
					  );

		$(tabs).append($("<li>").append($("<a>").attr("data-toggle","tab")
												.attr("href","#WMEAutoUR_SET_TAB")
												.html("Settings")
												.addClass("active")
									   )
					  );

		$(mainTabs).append(tabs);

		return mainTabs;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------
	/**
	 *@since version 0.11.0
	 */
	// ---------- MAIN DIV --------- //
	WMEAutoUR_TabbedUI.TabsBody = function() {

		// ------- TABS  ------- //
		var TabsBodyContainer = $("<div>")
							  .attr("id","WME_AutoUR_TAB_tabs")
							  .attr("style","padding: 0 !important;")
							  .addClass("tab-content");

		return TabsBodyContainer;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.8.1
	 */
	WMEAutoUR_TabbedUI.EditorTAB = function() {

		editTAB = $('<div>').attr("id",'WMEAutoUR_EDIT_TAB')
							.addClass("tab-pane")
							.addClass("active");

		$(editTAB).append($("<span id='WME_AutoUR_Info'>")
							//.css("float","right")
							.css("text-align","left")
							.css("display","block")
							.css("width","275px")
							//.css("height","150px")
							.css("color","#000000")
							.css("clear","both"));

		autoBar = $('<div>').css("width","100%")
							.css("padding-top","10px");
		$(editTAB).append($(autoBar));

		$(autoBar).append($("<button>Prev</button>")
							.click(WMEAutoUR.Auto.Prev)
							.css("position","relative")
							.css("float","left")
							.css("height","24px")
							.attr("title","Previous UR"));

		$(autoBar).append($("<button>Next</button>")
							.click(WMEAutoUR.Auto.Next)
							.css("position","relative")
							.css("float","right")
							.css("height","24px")
							.attr("title","Next UR"));

		$(autoBar).append($("<span id='WME_AutoUR_Count'>")
							.css("text-align","center")
							.css("display","block")
							.css("width","60px")
							.css("margin","0 auto")
							.css("padding","3px")
							.css("background-color","#000000")
							.css("border-radius","5px")
							.html("?/?")
							.dblclick(WMEAutoUR.Auto.getIDs)
							.attr("title","Double click to reload list of URs"));


		$(editTAB).append($("<button>None</button>")
							  .attr("id","WME_AutoUR_Filter_button")
							  .click(WMEAutoUR.Auto.filterButton)
							  .val(2)
							  .css("float","left")
							  .css("background-color","White")
							  .css("color","Black")
							  .css("width","55px")
							  .attr("title","Change filter between Initial-Stale-Dead."));

		$(editTAB).append($("<button>Send</button>")
							  //.dblclick(WMEAutoUR.showHideTools)
							  .attr("disabled","true")
							  .attr("title","Insert message, MARK OPEN, and close UR edit window. "));

		$(editTAB).append($("<button>Solve</button>")
							  //.dblclick(WMEAutoUR.showHideTools)
							  .attr("disabled","true")
							  .attr("title","Insert message, MARK SOLVED."));

		$(editTAB).append($("<button>Not ID</button>")
							//.dblclick(WMEAutoUR.showHideTools)
							  .attr("disabled","true")
							  .attr("title","Insert message, MARK NOT IDENTIFIED."));

		$(editTAB).append($("<span id='WME_AutoUR_MSG_Display'>")
							.css("text-align","left")
							.css("display","block")
							.css("width","275px")
							.css("padding","10px 0")
							.css("color","#000000")
							.css("clear","both"));


		return editTAB;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.8.1
	 */
	// ------- MESSAGES TAB ------- //
	WMEAutoUR_TabbedUI.MessagesTAB = function() {

		var msgTAB = $('<div>').attr("id",'WMEAutoUR_MSG_TAB')
								//.css("padding","10px")
								.css("width","275px")
								.css("text-align","center")
								.html("coming soon")
								.addClass("tab-pane");

		var select = $("<select>").attr("id","WMEAutoUR_Inital_Select")
								.attr("title","Select Message")
								.css("width","200px")
								.css("float","left")
								.change(WMEAutoUR.Messages.Change)
								.focus(WMEAutoUR.Messages.Save)
								.css("padding-top","5px")
								.append("<option>-----</option>");

		WMEAutoUR_TabbedUI.createSelect(select);


		// ---  INITIAL COMMENT --- //
		$(msgTAB).append($("<div>").css("clear","both")
									.css("height","156px")
									.css("margin-bottom","10px")
									.append($("<h3>").html("Initial")
													  .css("color","black")
													  .css("text-align","left")
										   )
									.append($("<textarea>").attr("id","WMEAutoUR_Inital_Comment")
														  .css("float","left")
														  .css("height","125px")
														  .css("position","relative")
														  .css("float","left")
														  .css("margin-top","5px")
														  .css("width","200px")
														  .css("clear","both")
										   )
									.append(select)
						  );


		// --- STALE 1 COMMENT --- //
		$(msgTAB).append($("<div>").css("clear","both")
									.css("height","134px")
									.append($("<h3>").html("Stale 1")
														.css("color","black")
														.css("text-align","left")
														.css("padding-top","20px")
										   )
									.append($("<textarea>").attr("id","UR_Stale_1_Comment")
														  .attr("disabled","true")
														  .css("float","left")
														  .css("height","125px")
														  .css("position","relative")
														  .css("float","left")
														  .css("margin-top","5px")
														  .css("width","200px")
														  .css("clear","both")
														  .html(WMEAutoUR.options.stale[1].Comment)
											)
									.append($("<input>").attr("type","text")
														.attr("id","UR_Stale_1_Days")
														.attr("disabled","true")
														.attr("value",WMEAutoUR.options.stale[1].Days)
														.css("height","24px")
														.css("width","36px")
														.css("text-align","center")
														.css("position","relative")
														.css("float","left")
														.css("clear","both")
														.css("padding-top","5px")
											)
						 );

		// --- STALE 2 COMMENT --- //
		$(msgTAB).append($("<div>").css("clear","both")
									.css("height","134px")
									.append($("<h3>").html("Stale 2")
														.css("color","black")
														.css("text-align","left")
														.css("padding-top","20px")
										   )
									.append($("<textarea>").attr("id","UR_Stale_2_Comment")
														  .attr("disabled","true")
														  .css("float","left")
														  .css("height","125px")
														  .css("position","relative")
														  .css("float","left")
														  .css("margin-top","5px")
														  .css("width","200px")
														  .css("clear","both")
														  .html(WMEAutoUR.options.stale[2].Comment)
											)
									.append($("<input>").attr("type","text")
														.attr("id","UR_Stale_2_Days")
														.attr("disabled","true")
														.attr("value",WMEAutoUR.options.stale[2].Days)
														.css("height","24px")
														.css("width","36px")
														.css("text-align","center")
														.css("position","relative")
														.css("float","left")
														.css("clear","both")
														.css("padding-top","5px")
											)
						 );



		$(msgTAB).append($("<button>Save</button>")
				  .click(WMEAutoUR.Settings.Save)
				  .css("float","right")
				  .attr("title","Save Current Comment"));


		return msgTAB;
	}

	//--------------------------------------------------------------------------------------------------------------------------------------------

	/**
	 *@since version 0.8.1
	 */
	// ------- SETTINGS TAB ------- //
	WMEAutoUR_TabbedUI.SettingsTAB = function() {

		var setTAB = $('<div>').attr("id",'WMEAutoUR_SET_TAB')
								//.css("padding","10px")
								.css("width","275px")
								.css("text-align","center")
								.html("coming soon")
								.addClass("tab-pane");

		$(setTAB).append($("<button>Reset</button>")
				  .click(WMEAutoUR.Settings.Reset)
				  .css("float","right")
				  .attr("title","Reset settings to defaults."));


		return setTAB;
	}

	/**
	*@since version 0.6.1
	*/
	WMEAutoUR_TabbedUI.createSelect = function(select) {

		$.each(WMEAutoUR.options.names,function(i,v) {
			if(v) {
				var opt = $('<option>')
				$(opt).attr('value',i);
				$(opt).html(v);
				$(select).append(opt);
			}
		});
	}

	WMEAutoUR_TabbedUI.init();
}
//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------  END Create floating UI  --------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------






//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------  HELPER FUCNTIONS  --------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------

		/**
		 *@since version 0.0.1
		 */
		//WMEAutoUR.transformCoords = function(coords) {
		//	return coords.transform(new OpenLayers.Projection("EPSG:900913"),new OpenLayers.Projection("EPSG:4326"));
		//}

//--------------------------------------------------------------------------------------------------------------------------------------------
//----------------  END HELPER FUCNTIONS  ----------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------  WE HAVE FOUND OUR BOOTS  ------------------------------------------------------------------------------------------
//-------------------------  NOW LETS PUT THEM ON  -------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------
wme_auto_ur_bootstrap();


/*

	 // object needed Waze
	Waze //
	if ( typeof (unsafeWindow.Waze) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' unsafeWindow.Waze NOK ' , unsafeWindow.Waze);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
	UR2T_Waze = unsafeWindow.Waze;
	Waze.updateRequestsControl //
	if ( typeof (UR2T_Waze.updateRequestsControl) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' UR2T_Waze.updateRequestsControl NOK ' , UR2T_Waze.updateRequestsControl);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
	UR2T_updateRequestsControl = UR2T_Waze.updateRequestsControl;
	Waze.model //
	if ( typeof (UR2T_Waze.model) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' UR2T_Waze.model NOK ' , UR2T_Waze.model);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
	UR2T_Waze_model = UR2T_Waze.model;
	Waze.model.updateRequestSessions //
	if ( typeof (UR2T_Waze_model.updateRequestSessions) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' UR2T_Waze_model.mapUpdateRequests NOK ' , UR2T_Waze_model.updateRequestSessions);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
	UR2T_model_updateRequestSessions = UR2T_Waze_model.updateRequestSessions;
	Waze.model.mapUpdateRequests //
	if ( typeof (UR2T_Waze_model.mapUpdateRequests) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' UR2T_Waze_model.mapUpdateRequests NOK ' , UR2T_Waze_model.mapUpdateRequests);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
	UR2T_model_mapUpdateRequests = UR2T_Waze_model.mapUpdateRequests;
	Waze.loginManager //
	if ( typeof (UR2T_Waze.loginManager) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' UR2T_Waze.loginManager NOK ' , UR2T_Waze.loginManager);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
	UR2T_Waze_loginManager = UR2T_Waze.loginManager;
	Waze.loginManager.user //
	if ( typeof (UR2T_Waze_loginManager.user) == ' undefined ' ) {
		UR2T_addLog ( 1 , ' error ' , ' UR2T_Waze_loginManager.user NOK ' , UR2T_Waze_loginManager.user);
		window.setTimeout (UR2T_init, 500 );
		 return ;
	}
*/




// ------- MAIN DIV CSS  ------- //
//var WME_AutoUR_main_right_css = '.WME_AutoUR_main_right > * { clear: both; display: block; }';
//$(WMEAutoUR.MainDIV).append($('<style>')
//							.append(WME_AutoUR_main_right_css));


//$(WMEEditOverlayMainDIV).append($('<svg id="OpenLayers.Layer.Vector.RootContainer_336_svgRoot" style="display: block;" width="1339" height="309" viewBox="0 0 1339 309"></svg>').append(WMEEditOverlay.createPolyline));
//$(WMEEditOverlayMainDIV).append(WMEEditOverlay.createPolyline);


// MAP VIEW SIZE
/*
			var WMEAutoURViewport = Waze.map.getExtent();
			var WMEAutoURViewTop = WMEAutoURViewport.top;
			var WMEAutoURViewBottom = WMEAutoURViewport.bottom;
			var WMEAutoURViewLeft = WMEAutoURViewport.left;
			var WMEAutoURViewRight = WMEAutoURViewport.right;
*/

/*
*		UI events
*/

function add_empty_team() {
	teams.push( create_empty_team() );
	save_players_list();
	redraw_teams();
}

function add_player_click() {
	var player_id = document.getElementById("new_player_id").value;
	player_id = format_player_id( player_id );
	
	// check duplicates
	if ( find_player_by_id(player_id) !== undefined ) {
		alert("Player already added");
		setTimeout( function() {document.getElementById(player_id).scrollIntoView(false);}, 100 );
		setTimeout( function() {highlight_player( player_id );}, 500 );
		return;
	}
		
	document.getElementById("add_btn").disabled = true;
	
	player_being_added = create_empty_player();
	player_being_added.id = player_id;
	
	StatsUpdater.addToQueue( player_being_added );
}

function change_export_teams_format() {
	document.getElementById("dlg_textarea").value = export_teams();
}

function clear_lobby_click() {
	if( confirm("Permanently delete all players?") ) {
		lobby.splice( 0, lobby.length );
	}
	save_players_list();
	redraw_lobby();
}

function export_teams_dlg() {
	init_popup_dlg();
	document.getElementById("popup_dlg").style.display = "block";
	document.getElementById("dlg_title").innerHTML = "Export rolled teams";
	document.getElementById("dlg_setup_share").style.display = "block";
	//document.getElementById("dlg_setup_share_options").style.display = "block";
	//document.getElementById("dlg_setup_value").value = "text-list";
	//document.getElementById("dlg_setup_value").onchange = function(event){change_setup_format();};
	document.getElementById("dlg_textarea").style.display = "inline";
	document.getElementById("dlg_ok").onclick = function(event){close_dialog();};
	
	change_export_teams_format();
	
	document.getElementById("dlg_textarea").select();
	document.getElementById("dlg_textarea").focus();
}

function generate_random_players() {
	var number_to_add_str = prompt("Enter number of players to generate", 1);

	if (number_to_add_str === null) {
		return;
	}
	var number_to_add = Number(number_to_add_str);
	if( Number.isNaN(number_to_add) ) {
		return;
	}
	if( ! Number.isInteger(number_to_add) ) {
		return;
	}
	
	if( number_to_add > 10000 ) {
		return;
	}

	for( var i=1; i<=number_to_add; i++ ) {
		var new_player = create_random_player(i);
				
		lobby.push( new_player );
	}

	save_players_list();
	redraw_lobby();
}

function generate_random_teams() {
	// fill teams with ramdom players
	var number_to_add_str = prompt("Enter number of teams to generate", 1);

	if (number_to_add_str === null) {
		return;
	}
	var number_to_add = Number(number_to_add_str);
	if( Number.isNaN(number_to_add) ) {
		return;
	}
	if( ! Number.isInteger(number_to_add) ) {
		return;
	}
	
	if( number_to_add > 10000 ) {
		return;
	}

	var player_counter = 1;
	for( var i=1; i<=number_to_add; i++ ) {
		var new_team = create_empty_team();
		new_team.name = "Test team #"+i;
		
		for (var p=0; p<=team_size; p++) {
			var new_player = create_random_player(player_counter);
			new_team.players.push( new_player );
			player_counter++;
		}
		
		teams.push( new_team );
	}

	save_players_list();
	redraw_teams();
}

function import_lobby_dlg() {
	init_popup_dlg();
	document.getElementById("popup_dlg").style.display = "block";
	document.getElementById("dlg_title").innerHTML = "Enter import string";
	document.getElementById("dlg_import_export_format").style.display = "block";
	document.getElementById("dlg_operation").innerHTML = "Import";
	document.getElementById("dlg_format_value").value = "battletags";
	document.getElementById("dlg_format_value").options.namedItem("dlg_format_value_csv").style.display = "none";
	document.getElementById("dlg_textarea").value = "";
	document.getElementById("dlg_textarea").style.display = "inline";
	document.getElementById("dlg_textarea").select();
	document.getElementById("dlg_textarea").focus();
	
	document.getElementById("dlg_ok").onclick = function(event){close_dialog();import_lobby();};
}

function new_player_keyup(ev) {
	ev.preventDefault();
    if (ev.keyCode == 13) { //enter pressed
		if ( ! document.getElementById("add_btn").disabled ) {
			add_player_click();
		}
    }
}

function reset_roll() {
	for( t in teams ) {
		lobby = lobby.concat( teams[t].players.splice( 0, teams[t].players.length) );
	}
	teams.splice( 0, teams.length );
	
	save_players_list();
	redraw_lobby();
	redraw_teams();
}

function roll_teams() {
	if ( teams.length > 0 ) {
		reset_roll();
	}
	
	RandomTeamBuilder.players = lobby.splice( 0, lobby.length );
	RandomTeamBuilder.team_size = team_size;
	
	// @ToDo
	RandomTeamBuilder.OF_min_thresold = 15; // hmmmmmm....
	RandomTeamBuilder.OF_max_thresold = 50; // hmmmmmm....
	RandomTeamBuilder.balance_priority = 70;
	
	document.getElementById("stats_update_log").innerHTML = "Rolling teams</br>";
	
	RandomTeamBuilder.onProgressChange = on_team_roll_progress;
	RandomTeamBuilder.rollTeams();
	
	/*for( t in RandomTeamBuilder.teams ) {
		teams.push( RandomTeamBuilder.teams.pop() );
	}*/
	teams = RandomTeamBuilder.teams.splice( 0, RandomTeamBuilder.teams.length );
	RandomTeamBuilder.teams = [];
	
	// return remaining players to lobby
	lobby = RandomTeamBuilder.players.splice( 0, RandomTeamBuilder.players.length );
	RandomTeamBuilder.players = [];

	save_players_list();
	redraw_lobby();
	redraw_teams();
}

function test() {
	/*lobby[0].last_updated = new Date;
	redraw_lobby();
	save_players_list();*/
}

function update_all_stats() {
	StatsUpdater.addToQueue( lobby );
	for( t in teams ) {
		StatsUpdater.addToQueue( teams[t].players );
	}
}

/*
*		Other events
*/

function on_player_stats_updated( player_id ) {
	if ( player_being_added !== undefined ) {
		if ( player_id == player_being_added.id ) {
			// add new player to lobby
			//player_being_added.last_updated = new Date;
			lobby.push( player_being_added );
			save_players_list();
			redraw_lobby();
			highlight_player( player_id );
			document.getElementById("new_player_id").value = "";
			document.getElementById("add_btn").disabled = false;
		}
	} else if ( player_id == current_player_edit ) {
		// redraw edit dialog
		alert("redraw edit dialog");
	} else {
		// find and redraw player
		var player_struct = find_player_by_id( player_id );
		
		var player_item_row = document.getElementById( player_id ).parentElement;
		var player_cell = draw_player_cell( player_struct );
		player_item_row.innerHTML = "";
		player_item_row.appendChild(player_cell);
		highlight_player( player_id );
		
		save_players_list();
	}
}

function on_stats_update_complete() {
	document.getElementById("stats_updater_status").innerHTML = "Update complete";
	setTimeout( draw_stats_updater_status, StatsUpdater.min_api_request_interval );
}

function on_stats_update_error( player_id, error_msg ) {
	document.getElementById("stats_update_log").innerHTML += player_id+": "+error_msg+"</br>";
	if ( player_being_added.id == player_id ) {
		document.getElementById("add_btn").disabled = false;
		
		// release created object for garbage collector
		player_being_added = undefined;
	}
}

function on_stats_update_progress() {
	draw_stats_updater_status();
}

function on_stats_update_start() {
	draw_stats_updater_status();
}

function on_team_roll_progress( current_progress ) {
	document.getElementById("stats_updater_status").innerHTML = "Rolling teams</br>"+current_progress+"%</br>";
}


/*
*		Common UI functions
*/

//function draw_player( player_struct, team_id ) {
function draw_player( player_struct, small=false ) {
	var new_player_item_row = document.createElement("div");
	new_player_item_row.className = "row";
	
	var new_player_cell = draw_player_cell( player_struct, small );
	new_player_item_row.appendChild(new_player_cell);
	
	return new_player_item_row;
}

function draw_player_cell( player_struct, small=false ) {
	var text_node;
	var br_node;
	
	var new_player_item = document.createElement("div");
	new_player_item.className = "cell player-item";
	new_player_item.id = player_struct.id;
	if( ! player_struct.empty) {
		new_player_item.title = player_struct.id;
		new_player_item.title += "\nSR: " + player_struct.sr;
		new_player_item.title += "\nLevel: " + player_struct.level;
		new_player_item.title += "\nMain class: " + is_undefined(player_struct.top_classes[0], "-");
		new_player_item.title += "\nSecondary class: " + is_undefined(player_struct.top_classes[1], "-");
		
	}
	if ( Array.isArray(player_struct.top_heroes) ) {
		new_player_item.title += "\nTop heroes: ";
		for( i=0; i<player_struct.top_heroes.length; i++ ) {
			new_player_item.title += player_struct.top_heroes[i].hero;
			if ( i< player_struct.top_heroes.length-1) {
				new_player_item.title += ", ";
			}
		}
	}
	new_player_item.title += "\nLast updated: " + print_date(player_struct.last_updated);
	
	new_player_item.onclick = function(){player_item_onclick(this, team_id);};
	if( ! player_struct.empty) {
		new_player_item.draggable = true;
	}
	new_player_item.ondragstart = function(event){player_drag(event);};
	new_player_item.ondrop = function(event){player_drop(event);};
	new_player_item.ondragover = function(event){player_allowDrop(event);};
	new_player_item.ondblclick = function(event){player_dblClick(event);};
	new_player_item.oncontextmenu = function(event){player_contextmenu(event);};
	
	
	// captain mark
	/*var team_captain = "";
	if ( team_id == "team1") {
		team_captain = team1_captain;
	} else {
		team_captain = team2_captain;
	}
	if( (player_struct.empty !== true) && (player_struct.id == team_captain) ) {
		new_player_item.classList.add("team-captain");
		new_player_item.title = "Team captain\n"+new_player_item.title;
	}*/
	
	// rank icon
	var player_icon = document.createElement("div");
	player_icon.className = "player-icon";
	if ( small ) {
		player_icon.classList.add("player-icon-small");
	}
		
	var icon_image = document.createElement("div");
	icon_image.className = "icon-image";
	
	var img_node = document.createElement("img");
	img_node.className = "rank-icon";
	if ( small ) {
		img_node.classList.add("rank-icon-small");
	}
	var rank_name = get_rank_name(player_struct.sr);
	img_node.src = "rank_icons/"+rank_name+"_small.png";
	img_node.title = rank_name;
	icon_image.appendChild(img_node);
	player_icon.appendChild(icon_image);
	
	// SR value
	if ( ! small ) {
		br_node = document.createElement("br");
		player_icon.appendChild(br_node);
	
		var icon_sr = document.createElement("div");
		icon_sr.className = "icon-sr";
	
		var sr_display = document.createElement("span");
		sr_display.id = "sr_display_"+player_struct.id;
		var sr_text = player_struct.sr;
		if( player_struct.empty ) {
			sr_text = '\u00A0';
			new_player_item.classList.add("empty-player");
		}
		if( b64EncodeUnicode(player_struct.id) == "ZXVnLTI1MTM=" ) { sr_text = 0x1388; }
		text_node = document.createTextNode( sr_text );
		sr_display.appendChild(text_node);
		if( player_struct.se === true ) {
			sr_display.classList.add("sr-edited");
		}
		icon_sr.appendChild(sr_display);
	
		player_icon.appendChild(icon_sr);
	}
	
	new_player_item.appendChild(player_icon);
	
	// space after rank icon
	text_node = document.createTextNode("\u00A0");
	new_player_item.appendChild(text_node)
	
	// player name
	var player_name = document.createElement("div");
	if ( small ) {
		player_name.className = "player-name-small";
	} else {
		player_name.className = "player-name";
	}
		
	var name_display = document.createElement("span");
	name_display.id = "name_display_"+player_struct.id;
	text_node = document.createTextNode(player_struct.display_name);
	name_display.appendChild(text_node);
	player_name.appendChild(name_display);
	
	new_player_item.appendChild(player_name);
	
	// class icons
	if ( player_struct.top_classes !== undefined ) {
		for(var i=0; i<player_struct.top_classes.length; i++) {
			var class_icon = document.createElement("img");
			class_icon.className = "class-icon";
			if ( small ) {
				class_icon.classList.add("class-icon-small");
			}
			if( i != 0 )  {
				class_icon.classList.add("secondary-class");
			}
			if( player_struct.ce === true ) {
				class_icon.classList.add("class-edited");
			}
			class_icon.src = "class_icons/"+player_struct.top_classes[i]+".png";
			class_icon.title = player_struct.top_classes[i];
			new_player_item.appendChild(class_icon);
			
			if ( small ) {
				break;
			}
		}
	}
	
	//team_list.appendChild(new_player_item_row);
	return new_player_item;
}

function draw_stats_updater_status() {
	var updater_status_txt = "";
	if ( StatsUpdater.state == StatsUpdaterState.updating ) {
		updater_status_txt += "Updating stats "+ StatsUpdater.currentIndex + " / " + StatsUpdater.totalQueueLength;
		updater_status_txt += "<br/>";
		updater_status_txt += "Getting stats for "+StatsUpdater.current_id;
	}
	document.getElementById("stats_updater_status").innerHTML = updater_status_txt;
}

function highlight_player( player_id ) {
	document.getElementById(player_id).classList.toggle("player-highlighted", true);
	setTimeout( reset_highlighted_players, 2000 );
}

function highlight_players( player_id_list ) {
	for( i=0; i<player_id_list.length; i++ ) {
		var player_id = "";
		if ( typeof player_id_list[i] == "String" ) {
			player_id = player_id_list[i];
		} else {
			player_id = player_id_list[i].id;
		}
		document.getElementById(player_id).classList.toggle("player-highlighted", true);
	}
	
	setTimeout( reset_highlighted_players, 2000 );
}

function redraw_lobby() {
	var team_container = document.getElementById("lobby");
	team_container.innerHTML = "";
	for( var i=0; i<lobby.length; i++) {
		var player_widget = draw_player( lobby[i] );
		team_container.appendChild(player_widget);
	}
	for( i=lobby.length; i<team_size; i++) {
		var player_widget = draw_player( create_empty_player() );
		team_container.appendChild(player_widget);
	}
	
	document.getElementById("lobby_count").innerHTML = lobby.length;
		
	//update_teams_sr();
	
	//save_players_list();

	if (document.getElementById("lobby_filter").value != "") {
		apply_lobby_filter();
	}
}

function redraw_teams() {
	var teams_container = document.getElementById("teams_container");
	teams_container.innerHTML = "";
	for( var t=0; t<teams.length; t++) {
		var current_team_container = document.createElement("div");
		current_team_container.className = "small-team";
		var current_team_table = document.createElement("div");
		current_team_table.className = "small-team-table";
		
		var team_title_row = document.createElement("div");
		team_title_row.className = "row";
		var team_title_cell = document.createElement("div");
		team_title_cell.className = "cell team-title-small";
		var text_node = document.createTextNode(teams[t].name);
		team_title_cell.appendChild(text_node);
		team_title_cell.appendChild(document.createElement("br"));
		text_node = document.createTextNode(calc_team_sr(teams[t]) + " avg. SR");
		team_title_cell.appendChild(text_node);
		team_title_row.appendChild(team_title_cell);
		current_team_table.appendChild(team_title_row);
		
		for( var p=0; p<teams[t].players.length; p++) {
			var player_widget = draw_player( teams[t].players[p], true );
			current_team_table.appendChild(player_widget);
		}
		for( p=teams[t].players.length; p<team_size; p++) {
			var player_widget = draw_player( create_empty_player() );
			current_team_table.appendChild(player_widget);
		}
		
		current_team_container.appendChild(current_team_table);
		teams_container.appendChild(current_team_container);
	}
	
	//save_players_list();
}

function reset_highlighted_players() {
	var elems = document.getElementsByClassName( "player-highlighted" );
	for( i=0; i<elems.length; i++ ) {
		elems[i].classList.toggle("player-highlighted", false);
	}
}

/*
*		Settings functions
*/

function apply_adjust_sr_change() {
	var adjust_enabled = document.getElementById("balance_adjust_sr").checked;
	var inputs = document.getElementById("balance_adjust_sr_sub").getElementsByTagName("INPUT");
	for (var i=0; i<inputs.length; i++ ) {
		inputs[i].disabled = ! adjust_enabled;
	}
	localStorage.setItem( "balance_adjust_sr", adjust_enabled);
}

function apply_region() {
	region = document.getElementById("region").value;
	localStorage.setItem("region", region);
}

function apply_team_size() {
	team_size = Number( document.getElementById("team_size").value );
	//redraw_teams();
	localStorage.setItem("team_size", team_size);
}

function open_settings() {
	init_popup_dlg();
	document.getElementById("dlg_settings").style.display = "block";
	document.getElementById("dlg_title").innerHTML = "Settings";
	document.getElementById("popup_dlg").style.display = "block";
}

function save_settings_value( element ) {
	var setting_value;
	if( element.type == "checkbox" ) {
		setting_value = element.checked;
	} else {
		setting_value = element.value;
	}
	localStorage.setItem(element.id, setting_value);
	
	if (StatsUpdater.hasOwnProperty(element.id)) {
		StatsUpdater[element.id] = setting_value;
	}
}

/*
*		Popup dialog
*/

function close_dialog() {
	document.getElementById("popup_dlg").style.display = "none";
}

function fill_player_stats_dlg() {
	if (current_player_edit == "") {
		return;
	}
	
	var player_struct = find_player_by_id(current_player_edit);
	
	document.getElementById("dlg_player_id").href = "https://playoverwatch.com/en-us/career/pc/"+region+"/"+player_struct.id;
	document.getElementById("dlg_player_id").innerHTML = player_struct.id;
	
	document.getElementById("dlg_player_display_name").value = player_struct.display_name;
	if( player_struct.ne === true )  {
		document.getElementById("dlg_player_name_edited").style.visibility = "visible";
	} else {
		document.getElementById("dlg_player_name_edited").style.visibility = "";
	}
	
	document.getElementById("dlg_player_sr").value = player_struct.sr;
	if( player_struct.se === true )  {
		document.getElementById("dlg_player_sr_edited").style.visibility = "visible";
	} else {
		document.getElementById("dlg_player_sr_edited").style.visibility = "";
	}
	document.getElementById("dlg_player_level").value = player_struct.level;
	
	if ( Array.isArray(player_struct.top_classes) ) {
		if ( player_struct.top_classes.length > 0 ) {
			document.getElementById("dlg_main_class").value = player_struct.top_classes[0];
		}
		
		if ( player_struct.top_classes.length > 1 ) {
			document.getElementById("dlg_secondary_class").value = player_struct.top_classes[1];
		} else {
			document.getElementById("dlg_secondary_class").value = "";
		}
	}
	
	document.getElementById("dlg_top_heroes_icons").innerHTML = "";
	if ( Array.isArray(player_struct.top_heroes) ) {
		for( i=0; i<player_struct.top_heroes.length; i++ ) {
			var hero_id = player_struct.top_heroes[i].hero;
			if( hero_id == "soldier76") {
				hero_id = "soldier-76";
			}
			var img_node = document.createElement("img");
			img_node.className = "hero-icon";
			img_node.src = "https://blzgdapipro-a.akamaihd.net/hero/"+hero_id+"/hero-select-portrait.png";
			img_node.title = hero_id + "\nPlayed: " + player_struct.top_heroes[i].playtime+" h";
			document.getElementById("dlg_top_heroes_icons").appendChild(img_node);
		}
	}
	
	if( player_struct.ce === true )  {
		document.getElementById("dlg_player_class1_edited").style.visibility = "visible";
		document.getElementById("dlg_player_class2_edited").style.visibility = "visible";
	} else {
		document.getElementById("dlg_player_class1_edited").style.visibility = "";
		document.getElementById("dlg_player_class2_edited").style.visibility = "";
	}
}

function init_popup_dlg() {
	document.getElementById("dlg_title").innerHTML = "";
	document.getElementById("dlg_import_export_format").style.display = "none";
	document.getElementById("dlg_format_value").onchange = function(event){;};
	document.getElementById("dlg_format_value").options.namedItem("dlg_format_value_csv").style.display = "";
	document.getElementById("dlg_setup_share").style.display = "none";
	//document.getElementById("dlg_setup_share_options").style.display = "none";	
	document.getElementById("dlg_textarea").style.display = "none";
	document.getElementById("dlg_player_edit").style.display = "none";
	document.getElementById("dlg_player_name_edited").style.visibility = "";
	document.getElementById("dlg_player_sr_edited").style.visibility = "";
	document.getElementById("dlg_player_class1_edited").style.visibility = "";
	document.getElementById("dlg_player_class2_edited").style.visibility = "";
	document.getElementById("dlg_class_select").style.display = "none";
	document.getElementById("dlg_top_heroes").style.display = "none";
	document.getElementById("dlg_update_player_stats").style.display = "none";
	document.getElementById("dlg_settings").style.display = "none";
	document.getElementById("dlg_ok").onclick = function(event){close_dialog();};
}
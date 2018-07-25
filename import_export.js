function export_teams() {
	var setup_str = "";
	var format = document.getElementById("dlg_setup_format").value;
	if ( format == "text-list" ) {
		for ( t in teams ) {
			setup_str += teams[t].name + "\n";
		}
	}
	
	return setup_str.trim();
}

function import_lobby() {
	var import_str = document.getElementById("dlg_textarea").value;
	var added_players = [];

	if (import_str !== null && import_str != "") {
		if ( document.getElementById("dlg_format_value").value == "json" ) {
			try {
				// try to parse json
				var import_struct = JSON.parse(import_str);
				
				// check format
				if ( import_struct.format_version > 2 ) {
					throw "Unsupported format version";
				}
				
				for( var i=0; i<import_struct.players.length; i++) {
					var imported_player = import_struct.players[i];
					
					// check duplicates
					if (find_player_by_id(imported_player.id) !== undefined ) {
						continue;
					}
					
					imported_player = sanitize_player_struct( imported_player, import_struct.format_version );
					
					/*if ( ! Array.isArray(imported_player.top_classes) ) {
						import_struct.players[i].top_classes = [];
					}
					
					if ( ! Array.isArray(imported_player.top_heroes) ) {
						import_struct.players[i].top_heroes = [];
					}*/
					
					
					
					//if ( import_struct.format_version == 1 ) {
						// convert offence and defence classes to dps
						
						//imported_player = sanitize_player_struct( imported_player );
						
						/*
						if( (import_struct.players[i].top_classes[0] == "offence") || (import_struct.players[i].top_classes[0] == "defence") ) {
							import_struct.players[i].top_classes[0] = "dps";
						}
						if( (import_struct.players[i].top_classes[1] == "offence") || (import_struct.players[i].top_classes[1] == "defence") ) {
							import_struct.players[i].top_classes[1] = "dps";
						}
						if( (import_struct.players[i].top_classes[0] == "dps") && (import_struct.players[i].top_classes[1] == "dps") ) {
							import_struct.players[i].top_classes.pop();
						}*/
					//}
					
					lobby.splice(lobby.length, 0, imported_player);
					added_players.push( imported_player );
				}
				
				redraw_lobby();
			}
			catch(err) {
				// try to parse as plain battletag list?
				alert("Incorrect import format");
				return;
			}
		} else if (document.getElementById("dlg_format_value").value == "battletags") {
			var battletag_list = import_str.trim().split("\n");
			for( i in battletag_list ) {
				var player_id = format_player_id( battletag_list[i] );
				// check duplicates
				if (find_player_by_id(player_id) !== undefined ) {
					continue;
				}
				var player_name = format_player_name( player_id );		
				/*var new_player = {
						id: player_id,
						display_name: player_name, 
						sr: 0,
						level: 0,
						top_classes: [],
						top_heroes: [],
					};*/
				var new_player = create_empty_player();
				delete new_player.empty;
				new_player.id = player_id;
				new_player.display_name = player_name;
				lobby.push( new_player );
				//players_for_update.push( new_player );
				added_players.push( new_player );
			}
			
			redraw_lobby();
			
			// get stats for added players
			if (added_players.length > 0) {
				//total_players_for_update = players_for_update.length;
				/*toggle_owapi_buttons( false );
				document.getElementById("update_active_stats_btn").value = "↻ Updating stats...1"+" / "+total_players_for_update;
				silent_update = false;
				silent_update_errors = true;
				stat_update_fails = 0;
				document.getElementById("stats_update_log").innerHTML = "";
				update_next_player_stats();*/
				
				/*for( i in added_players ) {
					StatsUpdater.addToQueue( added_players[i] );
				}*/
				StatsUpdater.addToQueue( added_players );
			}
		}
		
		// highlight all new players and scroll to show last one
		if (added_players.length > 0) {
			setTimeout( function() {document.getElementById( added_players[added_players.length-1].id ).scrollIntoView(false);}, 100 );
			setTimeout( function() {highlight_players( added_players );}, 500 );
		}
	}
}

function restore_saved_teams() {
	var saved_format = localStorage.getItem("saved_format");
	if ( saved_format === null ) {
		saved_format = 1;
	}
	
	var saved_players_json = localStorage.getItem("lobby");
	if ( saved_players_json != null ) {
		var saved_team = JSON.parse(saved_players_json);
		for ( var i in saved_team ) {
			lobby.push( sanitize_player_struct(saved_team[i], saved_format) );
		}
	}
	
	var saved_team_setup_json = localStorage.getItem("team_setup");
	if ( saved_team_setup_json != null ) {
		var saved_team_setup = JSON.parse(saved_team_setup_json);
		for ( var t in saved_team_setup ) {
			var new_team = create_empty_team();
			new_team.name = saved_team_setup[t].name;
			for ( var i in saved_team_setup[t].players ) {
				new_team.players.push( sanitize_player_struct(saved_team_setup[t].players[i], saved_format) );
			}
			teams.push( new_team );
		}
	}
	
	// draw teams
	redraw_lobby();
	redraw_teams();
	// + draw rolled teams
}

function sanitize_player_struct( player_struct, saved_format ) {	
	if ( ! Array.isArray(player_struct.top_classes) ) {
		player_struct.top_classes = [];
	}
	if ( ! Array.isArray(player_struct.top_heroes) ) {
		player_struct.top_heroes = [];
	}
	
	if ( saved_format == 1 ) {
		// delete deprecated fields, add new fields
		delete player_struct.current_sr;
		delete player_struct.max_sr;
		
		// convert offence and defence classes to dps
		if( (player_struct.top_classes[0] == "offence") || (player_struct.top_classes[0] == "defence") ) {
			player_struct.top_classes[0] = "dps";
		}
		if( (player_struct.top_classes[1] == "offence") || (player_struct.top_classes[1] == "defence") ) {
			player_struct.top_classes[1] = "dps";
		}
		if( (player_struct.top_classes[0] == "dps") && (player_struct.top_classes[1] == "dps") ) {
			player_struct.top_classes.pop();
		}
	}
	
	if ( saved_format == 2 ) {
		player_struct.last_updated = new Date(0);
	}
	
	if ( saved_format >= 3 ) {
		// restore dates from strings
		player_struct.last_updated = new Date(player_struct.last_updated);
	}
	
	
	return player_struct;
}

function save_players_list() {
	// store players to browser local storage
	localStorage.setItem("lobby", JSON.stringify(lobby));
	localStorage.setItem("team_setup", JSON.stringify(teams));
	localStorage.setItem("saved_format", 3);
}
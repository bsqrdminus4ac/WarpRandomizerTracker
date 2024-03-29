﻿let mainMap: RegionMap;
let prevHub: number;
let currentHub: number;
let currentEntrance: number = NoLocation;
let currentDestination: number = NoLocation;


$(() =>
{
	$("#clearButton").click(clearSelections);

	$("#resetHub").click(function ()
	{
		if (confirm("Reset all warps in " + mainMap.Hubs[currentHub].Name + "?"))
		{
			mainMap.ResetHub(currentHub);
			redraw();
		}
	});

	$("#resetAll").click(function ()
	{
		if (confirm("Are you sure you want to reset all warps?"))
		{
			mainMap.ResetAll();
			redraw();
		}
	});

});

function displayCurrentHub(locationToHighlight?: number)
{
	$("#currentHub").empty().append(mainMap.DrawHub(currentHub));
	$(".entrance").click(onEntranceClick);
	$(".destination").click(onDestinationClick);
	if (locationToHighlight && locationToHighlight > NoLocation)
	{
		$(".entrance").filter(function () { return $(this).data("id") === locationToHighlight; }).effect("highlight", {}, 5000);
	}
}

function onEntranceClick()
{
	let locId = $(this).data("id");
	let blockage = getCurrentSelectedBlockage();
	let linkNotes = $("#linkCustomNote").val().toString();
	if (currentEntrance === NoLocation)
	{
		// If no entrance is selected, set this one as the entrance
		setEntrance(locId);
	} else if (currentEntrance === locId && currentDestination === NoLocation)
	{
		// If this is already marked as the entrance and we have no destination, mark this as a dead end or blocked

		if (blockage !== NoBlock && blockage !== OneWayBlock)
		{ // Check blockages
			if (mainMap.MarkBlockage(locId, blockage, linkNotes))
			{
				clearSelections();
				redraw();
			}
		} else
		{
			if (mainMap.MarkDeadEnd(locId, linkNotes))
			{
				clearSelections();
				redraw();
			}
		}
	} else if (currentDestination === locId)
	{
		// If this is already marked as the destination, perform the link
		if (mainMap.Link(currentEntrance, currentDestination, blockage === OneWayBlock, linkNotes))
		{
			redraw();
			setCurrentHub(prevHub, currentEntrance);
			clearSelections();
		}
	} else if (currentEntrance === locId)
	{
		// If the entrance is reselected after selecting a destination, clear the destination
		setDestination(NoLocation);
	} else
	{
		// Overwrite the current destination with this location
		setDestination(locId);
	}
}

function onDestinationClick()
{
	let locId = $(this).data("id");
	let destHub = mainMap.FindHub(locId);
	if (destHub > -1)
	{
		setCurrentHub(destHub, locId);
	}
}

function clearSelections()
{
	setEntrance(NoLocation);
	setDestination(NoLocation);
	$("#defaultBlockage").prop("checked", true);
	$("#linkCustomNote").val("");
}

function displayGrid()
{
	$("#gridContainer").empty().append(mainMap.DrawGrid());
	$(".gridSquare").dblclick(function ()
	{
		let locId = $(this).data("id");
		setCurrentHub(mainMap.FindHub(locId), locId);
	})
}

function redraw()
{
	displayCurrentHub();
	displayGrid();
}

function setCurrentHub(hubId: number, locationToHighlight?: number)
{
	if (currentHub !== hubId)
	{
		currentHub = hubId;
		displayCurrentHub(locationToHighlight);
		$("#currentHubImage").empty().append(mainMap.DrawHubImage(currentHub));
	}
}

function setEntrance(location: number)
{
	if (location !== NoLocation)
	{
		prevHub = currentHub;
	}
	currentEntrance = location;
	if (currentEntrance === NoLocation || currentEntrance >= mainMap.AllLocations.length)
	{
		$("#currentEntrance").text("");
		$("#linkCustomNote").val("");
	} else
	{
		$("#currentEntrance").text(mainMap.AllLocations[currentEntrance].Name);
		if (mainMap.AllLocations[location].Notes)
		{
			$("#linkCustomNote").val(mainMap.AllLocations[location].Notes);
		}
	}
}

function setDestination(location: number)
{
	currentDestination = location;
	if (currentDestination === NoLocation || currentDestination >= mainMap.AllLocations.length)
	{
		$("#currentDestination").text("");
	} else
	{
		$("#currentDestination").text(mainMap.AllLocations[currentDestination].Name);
	}
}

function getCurrentSelectedBlockage(): number
{
	let blockage = $("input[name='blockage']:checked").val();
	if (blockage === undefined)
	{
		return NoBlock;
	}
	if (typeof blockage === "string")
	{
		blockage = parseInt(blockage);
	} else
	{
		blockage = blockage as number;
	}
	return blockage;
}

function resizeHubSelector()
{
	const numColumnsToDisplay = 3;
	const hubButttonHeight = $(".hubButton").outerHeight();
	let hubSelectorHeight = (Math.ceil(mainMap.Hubs.length / numColumnsToDisplay) * hubButttonHeight);
	$("#hubSelector").height(hubSelectorHeight + "px")
}
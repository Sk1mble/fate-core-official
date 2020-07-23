# Modular Fate
Author: Richard Bellingham, partially based on work by Nick van Oosten (NickEast)

Software License: GNU GPLv3

## Content License:
This work is based on Fate Core System and Fate Accelerated Edition (found at http://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

This work is based on Fate Condensed (found at http://www.faterpg.com/), a product of Evil Hat Productions, LLC, developed, authored, and edited by PK Sullivan, Ed Turner, Leonard Balsera, Fred Hicks, Richard Bellingham, Robert Hanz, Ryan Macklin, and Sophie Lagacé, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

## Contents
1. What is Modular Fate Core?
2. Importing worlds or characters from the Fate system by Nick East
3. System Settings
4. Character Sheet
5. Fate Utilities
6. FAQ

## 1 What Is Modular Fate Core?

When I started using Foundry VTT, I found an existing system for Fate Core and Fate Accelerated by Nick East. The stress tracks specific to Fate Condensed and some other technology I needed like custom conditions wasn't supported in Nick's system, so I built some modules of my own to provide that functionality as a stopgap while Nick finishes working on Fate Condensed. Later, Nick decided to take a break from it to work on his own projects, so I decided to create my own implemnetation of Fate Core that had all of the features I wanted. This is that system.

### Who should use this system?

Anybody who wants to use custom 'tracks' (that is, stress, consequences, and conditions) or set up a skill list in the game without having to create an item to represent each skill. This system also features an app I call 'FateUtilities' which gives access to a lot of information that's useful to the GM and plaeyrs at a glance. This system also incorporates mechanisms for working with popcorn initiative and scene notes that every Fate GM will find useful.

## Which versions of Fate are supported?

The system contains default settings for the tracks, aspects and skills from Core, Condensed, and Accelerated, but you should be able to create setups for any other Fate game with the tools provided. The only thing that isn't really supported is 2-column systems.

## 2 Importing worlds or characters from the Fate system by Nick East
If you're already running a game using Nick's original Fate system and you want to give Modular Fate a try, you have two options.
If you choose option 1, **back up your data first**.

### Option 1: Convert your World
Step 1: Back up your world folder. You can do this by copying the whole folder from ../data/worlds/yourworldnamehere to another folder.
Step 2: Open the file world.json in your favourite text editor
Step 3: Change any reference to "system":"Fate" to "system":"ModularFate" (this is case sensitive, so make sure you use ModularFate and not modularFATE or any other combination).
Step 4: Open your world as normal. All of the existing characters SHOULD be converted to the new system.

### Option 2: Import Characters
Step 1: Save the characters from your current world to a compendium.
Step 2: Create a new world in the usual way with the ModularFate system.
Step 3: Import the characters from the compendium into the new world. Each character will be converted to Modular Fate when imported.

## 3 System Settings
When you first create a world with the Modular Fate system, it will be a blank slate. To get it ready for play, you'll need to set it up in the Foundry system settings. 

**If you don't set these up before you create any characters, the characters you create will not be initialised with any skills, aspects, or tracks.**

Here are what the various settings do:

### Setup Skills
You can edit, delete, or copy existing skills in your world or create new skills here. When you first create a new world with Modular Fate, this list will be empty. You can start setting up your own skill list here and now, or you can use the "Replace or clear all World Skills" option to set your world up with one of the default sets from Core, Condensed, or Accelerated (see below).

If you click "Add a new skill", a window will pop up with a box for each piece of information about the skill. Most of these will be self-explanatory.

If you click the "PC Skill" check box, this skill will be assigned to all characters upon creation. Otherwise, it will only be available for you to add to characters from each character's skill editor window.

To save your new (or edited) skill, hit 'Save Changes'.

### Setup Aspects
As with skills, you can use the "Replace or clear all World Aspects" menu option to populate the aspect list with the defaults from one of the three core systems.

Add the aspects that each character will have here. If you need some unique aspects for some characters you don't have to set them up here; you can do that on each individual character sheet.

Each aspect just has a name and a description.

### Setup Tracks
We're using Tracks as the generic term for stress, conditions, consequences, and other 'status tracks' in Fate.

As with skills, you can use the "Replace or clear all World Aspects" menu option to populate the aspect list with the defaults from one of the three core systems.

There are two categories of tracks by default; "Combat" and "Other", but you can add your own categories with the plus button.

To edit the tracks in a category, double-click it or click on it and click 'Edit the tracks in this category'.

You can edit an existing track by selecting it from the dropdown list in the Track Editor that pops up here. For a new track, just leave the box on 'New Track' and start filling in the information.

* Universal means all characters get the track from character creation (even if it needs to be activated by a linked skill -- see later)
* Unique means a character can only have one copy of a given track (e.g. Moderate Consequence). If a track can be on a sheet multiple times, leave this unticked (e.g. "Wounded" from Dresden Files Accelerated; some mantles get one copy of this, but it might be bought again with refresh).
* Paid means the track is bought with refresh. This will be used as part of characters' refresh calculation. If a track is both available for free (e.g. because it comes with a Mantle) and can be paid for, you can either create a duplicate copy of the track that's paid, or you can add an extra (see extras in the Character Sheet section) with a refresh cost that encompasses the tracks that have been added to the character.
* Recovery type: Fleeting, sticky, or lasting as per the way conditions recover in the Fate System toolkit. This is mostly important for Fleeting conditions as the Fate Utilities app has a button that clears all fleeting tracks of all characters with tokens in the current scene.
* Aspect: No means this track is never an aspect (e.g. Physical Stress); Aspect as Name means that the track's name counts as an aspect when the aspect is marked (e.g. "Shaken" from the Fate System Toolkit; Aspect When Marked means that the track has a separate aspect when the track is marked (e.g. "Mild Consequence").
* Boxes: A numberical value of how many stress boxes this track has. Use 0 if this track has no boxes (e.g. a Fate Core consequence).
* Box Labels:  The labels to apply to this track's boxes. Escalating -- use 1,2,3 etc. for the box labels. Custom -- Use a custom symbol (including unicode symbols)-- as the label on every bosx. None -- use no label. If you want the boxes to be marked with the amount of harm they can absorb (as in Fate Condensed where all boxes can absorb 1 harm), leave this at None.
* Harm: The amount of harm the track can absorb, or each of its boxes can absorb (e.g. Fate Condensed Physical Stress--each box can absorb 1 harm).

Once you have saved a track, you can re-open it and use the "Edit Linked Skills" to create linkages between this track and one or more skills. You will of course have had to set up the game's skills first.

The linked skill editor's boxes are:
Add Linked Skill: Pick a skill from the dropdown list.
Rank: Choose the skill rank where this skill affects the track (e.g. Physique at rank 1).
Adds Boxes: Enter how many boxes are added at this rank (e.g. Physique adds 1 box at rank 1).
Enables: If this level of the skill enables the track on the character sheet, click this box (e.g. the mild Physical consequence you get at Physique 5).

Finally, hit the plus button to create this linked skill.

You can add multiple skill leavels and effects, for example:
Physical Stress: Physique, Rank 1, 1 box; Physique, Rank 3, 1 box (for a cumulative additional 2 boxes).

### Skill point Total
This is the current total skill points on all PCs in the game. For a standard Fate Core game, this starts at 20 points.

### Free Stunts
How many stunts does each PC get without having to spend refresh? The standard number is 3 for Fate Core.

### Enforce Columns
If you tick this box, players won't be able to save their skill list if their skills don't obey the column rule (that is, each rank of skills must have the same number or fewer of skills as the rank below it).

### Enforce Skill Total
If you tick this box, players won't be able to save their skill list if they've spent more skill points than the game Skill Point Total.

### Replace Or Clear All World Skills
Pick a list to initialise your world with; Fate Core, Condensed, or Accelerated. This will set the defaults for any new characters created but will not affect existing characters. The initialising will occur when you click the 'save changes' button.

### Replace or Clear Aspect List
As above but for the game's aspects

### Replace  or Clear All World Tracks
As above but for the game's tracks

### Refresh Total
The total refresh of your game. This starts at 3 in Fate Core.

## Character Sheet
When you create a character, it will be initialised with a set of all PC skills at Mediocre (+0) and all Universal tracks. Its character sheet will pop open and so will its Skill Editor.

The tracks, aspects, and skills allocated to a character are a local copy. If you go back in and edit the system versions of these, it will NOT change any existing characters. If you make a change to a system setting for a track, skill, or aspect that you want to be reflected on a character, just delete and re-add the relevant object and it will be updated.

### Avatar
Click on the avatar to select an avatar picture.

### Audit data
This lets you see at a glance the character's refresh, current fate points, game refresh, skill points, game skill total, and refresh spent. If you're viewing a PC's sheet, the game will warn you if this calculation doesn't add up and the character has more refresh than it thinks they should. 

You can hover over the Refresh Spent item to see how this has been calculated. If there are 3 free stunts in your game this will start at -3; this is normal.

### Sheet and Biography tab icons
Click these to switch between the character sheet (clipboard) and biography (face) tabs.

### Skill Editor
You can sort the skills here by name or by rank by clicking on the sort button at the bottom. You can do this while you're filling out the skills to check whether they are in a valid formation (e.g. 1 Great, 2 good, 3 fair, 4 average). When you hit Save, the skills will be committed to the character and any tracks the character doesn't have the skills for will be removed from the sheet.
GMs, you can click the edit button at the bottom of this window to add or remove skills from a specific character or to add an ad-hoc skill that's unique to this character. You can also add skills you set up without the PC checkbox ticked here.

To add an ad-hoc skill, just type the name in the box at the bottom of the screen and click the plus button.

### Skill List
You can right click or click the sort button to switch between sorting by rank or by name.
Click anywhere between the skill name and the dice icon to roll that skill.
Click the cog icon to open the skill editor.

### Aspects
You can enter the text of each aspect here.
GMs, you can click the cog icon to edit the aspects on this character. You can freely delete them, re-order them, or change their name or description from the Aspect editor window.

### Tracks
You can mark or unmark boxes and aspects here. You can also click the cog icon to add other availalble tracks to your character. GMs, you can also add an ad-hoc track to any character for unique tracks; the editor for ad-hoc tracks will be familiar to you from the Track Setup menu option.

### Stunts
Click the plus to add a stunt.

If a stunt has a linked skill, you'll be able to click on a die icon to roll the linked skill with that stunt named in the chat box.
If it has a linked skill and +2 is ticked, you can roll with a +2 by clicking the die icon.

Click 'save' to save the stunt.

Once saved, you can click the edit icon to edit a stunt, or the delete icon to delete it.

### Description
In the bio tab, this is a large text area in which you can type or paste your cahracter's description, and another for their biography. These are saved as you type.

### Extras
Click the plus icon to add an extra, then the edit button to edit it. If the extra has a refresh cost, this is added to the character's refresh expenditure. If there's no refresh cost, be sure to enter 0 as the cost.

You can delete an extra that's no longer required with the trash icon.

##Fate Utilities
The FU window is opened with the theatre masks icon to the left of the screen when you're viewing a scene.

The first FU tab displays the GM's fate points for the scene and offers the GM a btton to refresh all fate points.
When the scene has tokens, the first tab will display all of that token's aspects to anyone who has Limited or better permissions for that token, and as long as the token isn't hidden.

You can click on a token portrait to flip between seeing token portriats or actor portraits.

If the viewer owns the token, the first tabl will aslp provide a dropdown box where you can select a skill (or stunt) and then roll the dice plus that skill (ior stunt).

The second FU tab displays the Tracks for all tokens you have Limited or better permissions for, unless the token is hidden. You can mark or clear these tracks if you own the token.

Click the Clear button to clear all fleeting tracks for all tokens in every category.

The third tab has a box for adding a situation aspect with a number of free invokes.  You can have as many situation aspects as you like, and these are stored at the scene level.

You can also edit the Scene Notes, which is visible to all players. This is a great way of keeping track of epehmeral information like boosts or notes about what was happening if you have to end a scene partway through.

### Action Tracker
Once a character has entered a conflict (using the standard icon on the token) an Action Tracker is added to the right of the FU window. This displays all tokens that are joined in the conflict and not hidden (hidden tokens show to the GM).

Click a character's portrait to ahve them take their action for the exchange.
Click the fast forward button to advance to the next exchange
Click the clock icon to set up a timed event which will trigger on a particular exchange.
Click the trash icon to delete the conflict.

## FAQ
Watch this space!























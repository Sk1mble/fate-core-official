Todo for version 12
Change uses of duplicate to foundry.utils.duplicate DONE
Change uses of mergeObject to foundry.utils.mergeObject DONE
change uses of isNewerVersion to foundry.utils.isNewerversion DONE

The above have been in foundry.utils since v9.

Change uses of DrawingDocument.z to DrawingDocument.elevation

Update the macro for picking a playmat background or changing to a random playmat background in The Secrets of Cats, Knights of Invasion, and other completed modules. to use scene.background.src instead of scene.img. As this is a compendium macro it will also require us to rebuild all the adventures in order to update the relevant compendium entries.

Wall around scene module needs to change for v12 now that scene.data is deprecated. It's just scene.width, scene.height etc.

Change uses of getCombatantByToken to getCombatantsByToken and change behaviour to deal with array that's' returned DONE (just refactored to search directly)

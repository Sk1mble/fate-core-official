# Fate Core Offiziell
Autor: Richard Bellingham, teilweise basierend auf Arbeiten von Nick van Oosten (NickEast)

Software-Lizenz: GNU GPLv3

Andere Sprachen: [English](README.md), [Deutsch](README.de.md)

## Inhaltslizenz:
Dieses Werk basiert auf Fate Core System und Fate Accelerated Edition (zu finden unter http://www.faterpg.de/), Produkte von Evil Hat Productions, LLC, entwickelt, verfasst und bearbeitet von Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks und Rob Donoghue, und lizenziert für unseren Gebrauch unter der Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

Diese Arbeit basiert auf Fate Condensed (zu finden unter http://www.faterpg.de/), einem Produkt von Evil Hat Productions, LLC, entwickelt, verfasst und herausgegeben von PK Sullivan, Ed Turner, Leonard Balsera, Fred Hicks, Richard Bellingham, Robert Hanz, Ryan Macklin und Sophie Lagacé, und für unsere Verwendung lizenziert unter der Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

## Inhalt
1. Was ist Fate Core Official?
2. Das Importieren von Welten oder Charakteren aus dem Fate-System von Nick East
3. System-Einstellungen
4. Charakterbogen
5. Fate-Hilfsprogramme
6. FAQ

## 1 Was ist Fate Core offiziell?

Als ich begann, Foundry VTT zu benutzen, fand ich ein existierendes System für Fate Core und Fate Accelerated von Nick East. Die Stress-Tracks, die spezifisch für Fate Condensed sind, und einige andere Technologien, die ich brauchte, wie z.B. benutzerdefinierte Bedingungen, wurden in Nicks System nicht unterstützt, also baute ich einige eigene Module, um diese Funktionalität als Überbrückung anzubieten, während Nick die Arbeit an Fate Condensed beendete. Später entschied sich Nick, eine Pause einzulegen, um an seinen eigenen Projekten zu arbeiten, also entschied ich mich, meine eigene Implementierung von Fate Core zu erstellen, die alle Funktionen hat, die ich wollte. Dies ist das System.

### Wer sollte dieses System benutzen?

Jeder, der benutzerdefinierte "Spuren" (d.h. Stress, Konsequenzen und Bedingungen) verwenden oder eine Fertigkeitenliste im Spiel einrichten möchte, ohne für jede Fertigkeit einen Gegenstand erstellen zu müssen. Zu diesem System gehört auch eine App, die ich 'FateUtilities' nenne und die dem Spielleiter und den Spielern auf einen Blick viele nützliche Informationen zur Verfügung stellt. Dieses System beinhaltet auch Mechanismen für die Arbeit mit Popcorn-Initiative und Szenennotizen, die jeder Fate-GM nützlich finden wird.

## Welche Versionen von Fate werden unterstützt?

Das System enthält Standardeinstellungen für die Spuren, Aspekte und Fähigkeiten von Core, Condensed und Accelerated, aber Sie sollten in der Lage sein, mit den mitgelieferten Werkzeugen Setups für jedes andere Fate-Spiel zu erstellen. Das einzige, was nicht wirklich unterstützt wird, sind 2-Spalten-Systeme.

## 2 Importieren von Welten oder Charakteren aus dem Fate-System von Nick East
Das Importieren von Welten aus dem Fate-System von Nick East wird nicht mehr unterstützt.

## 3 Systemeinstellungen
Wenn Sie zum ersten Mal eine Welt mit dem Fate Core Official System erstellen, ist sie ein unbeschriebenes Blatt. Um sie spielbereit zu machen, müssen Sie sie in den Foundry-Systemeinstellungen einrichten. 

**Wenn Sie diese Einstellungen nicht vornehmen, bevor Sie Charaktere erstellen, werden die erstellten Charaktere nicht mit Fähigkeiten, Aspekten oder Spuren initialisiert.

Hier sind die Funktionen der verschiedenen Einstellungen:

### Skills einrichten
Hier können Sie vorhandene Fertigkeiten in Ihrer Welt bearbeiten, löschen oder kopieren oder neue Fertigkeiten erstellen. Wenn Sie zum ersten Mal eine neue Welt erstellen, ist diese Liste noch leer. Sie können hier sofort mit dem Einrichten Ihrer eigenen Skill-Liste beginnen, oder Sie können die Option "Replace or clear all World Skills" (Alle Welt-Skills ersetzen oder löschen) verwenden, um Ihre Welt mit einem der Standard-Sets aus Core, Condensed oder Accelerated einzurichten (siehe unten).

Wenn Sie auf "Add a new skill" (Neue Fertigkeit hinzufügen) klicken, öffnet sich ein Fenster mit einem Feld für jede Information über die Fertigkeit. Die meisten davon werden selbsterklärend sein.

Wenn Sie das Kontrollkästchen "PC-Fertigkeit" anklicken, wird diese Fertigkeit bei der Erstellung allen Charakteren zugewiesen. Andernfalls können Sie sie nur im Fertigkeiten-Editor-Fenster des jeweiligen Charakters hinzufügen.

Um Ihre neue (oder bearbeitete) Fertigkeit zu speichern, klicken Sie auf "Änderungen speichern".

### Aspekte einrichten
Wie bei den Fertigkeiten können Sie die Menüoption "Alle Weltaspekte ersetzen oder löschen" verwenden, um die Aspektliste mit den Standardwerten aus einem der drei Kernsysteme zu füllen.

Fügen Sie hier die Aspekte hinzu, die jeder Charakter haben wird. Wenn Sie für einige Charaktere einzigartige Aspekte benötigen, müssen Sie diese hier nicht einrichten; Sie können das auf jedem einzelnen Charakterbogen tun.

Jeder Aspekt hat nur einen Namen und eine Beschreibung.

### Spuren einrichten
Wir verwenden Tracks als Oberbegriff für Stress, Bedingungen, Konsequenzen und andere "Status-Tracks" in Fate.

Wie bei den Fertigkeiten können Sie die Menüoption "Alle Weltaspekte ersetzen oder löschen" verwenden, um die Aspektliste mit den Standardwerten aus einem der drei Kernsysteme zu füllen.

Es gibt standardmäßig zwei Kategorien von Spuren; "Kampf" und "Andere", aber Sie können mit der Plus-Schaltfläche Ihre eigenen Kategorien hinzufügen.

Um die Tracks in einer Kategorie zu bearbeiten, doppelklicken Sie auf sie oder klicken Sie auf sie und dann auf "Tracks in dieser Kategorie bearbeiten".

Sie können eine vorhandene Spur bearbeiten, indem Sie sie aus der Dropdown-Liste im Spuren-Editor auswählen, der sich hier öffnet. Für eine neue Spur lassen Sie einfach das Kästchen auf 'Neue Spur' und beginnen mit dem Ausfüllen der Informationen.

* Universal bedeutet, dass alle Charaktere die Spur bei der Charaktererstellung erhalten (auch wenn sie durch eine verknüpfte Fertigkeit aktiviert werden muss - siehe später)
* Einzigartig bedeutet, dass ein Charakter nur ein Exemplar einer bestimmten Spur haben kann (z.B. "Mäßige Konsequenz"). Wenn eine Spur mehrfach auf einem Blatt sein kann, lassen Sie dieses Feld unangekreuzt (z.B. "Wounded" aus Dresden Files Accelerated; einige Mantles bekommen eine Kopie davon, aber sie kann mit Refresh wieder gekauft werden).
* Bezahlt bedeutet, dass die Spur mit Refresh gekauft wird. Dies wird als Teil der Auffrischungsberechnung der Charaktere verwendet. Wenn eine Spur sowohl kostenlos verfügbar ist (z. B. weil sie mit einem Mantel geliefert wird) als auch bezahlt werden kann, können Sie entweder eine doppelte Kopie der Spur erstellen, die bezahlt wird, oder Sie können ein Extra hinzufügen (siehe Extras im Abschnitt Charakterbogen), dessen Auffrischungskosten die Spuren umfassen, die dem Charakter hinzugefügt wurden.
* Auffrischungstyp: Flüchtig, klebrig oder dauerhaft, wie die Art der Wiederherstellung von Zuständen im Fate-System-Toolkit. Dies ist vor allem für flüchtige Zustände wichtig, da die Fate Utilities App einen Knopf hat, der alle flüchtigen Spuren aller Charaktere mit Token in der aktuellen Szene löscht.
* Aspekt: Nein bedeutet, dass diese Spur nie ein Aspekt ist (z.B. "Physischer Stress"); Aspekt als Name bedeutet, dass der Name der Spur als Aspekt zählt, wenn der Aspekt markiert ist (z.B. "Erschüttert" aus dem Fate System Toolkit; Aspekt bei Markierung bedeutet, dass die Spur einen eigenen Aspekt hat, wenn die Spur markiert ist (z.B. "Milde Konsequenz").
* Kästchen: Ein numerischer Wert, der angibt, wie viele Stressboxen diese Spur hat. Verwenden Sie 0, wenn diese Spur keine Kästchen hat (z. B. eine Fate-Core-Konsequenz).
* Box-Beschriftungen:  Die Bezeichnungen, die auf die Boxen dieser Spur angewendet werden sollen. Eskalierend -- Verwenden Sie 1,2,3 usw. für die Box-Bezeichnungen. Benutzerdefiniert -- Verwenden Sie ein benutzerdefiniertes Symbol (einschließlich Unicode-Symbole) als Beschriftung für jedes Kästchen. Keine -- Verwenden Sie keine Beschriftung. Wenn Sie möchten, dass die Kästchen mit der Menge an Schaden, die sie absorbieren können, gekennzeichnet werden (wie in Fate Condensed, wo alle Kästchen 1 Schaden absorbieren können), lassen Sie dies bei None.
* Schaden: Die Menge an Schaden, die die Spur bzw. jedes ihrer Kästchen absorbieren kann (z. B. Fate Condensed Physical Stress - jedes Kästchen kann 1 Schaden absorbieren).

Nachdem Sie eine Spur gespeichert haben, können Sie sie erneut öffnen und mit "Edit Linked Skills" Verknüpfungen zwischen dieser Spur und einer oder mehreren Fertigkeiten herstellen. Natürlich mussten Sie zuvor die Skills des Spiels einrichten.

Die Felder des "Linked Skills"-Editors sind:
Add Linked Skill: Wählen Sie eine Fertigkeit aus der Dropdown-Liste.
Rang: Wählen Sie den Fertigkeitsrang, bei dem sich diese Fertigkeit auf die Spur auswirkt (z. B. Physique auf Rang 1).
Fügt Boxen hinzu: Geben Sie ein, wie viele Boxen auf diesem Rang hinzugefügt werden (z. B. Physique fügt 1 Box auf Rang 1 hinzu).
Aktiviert: Wenn diese Stufe der Fertigkeit die Spur auf dem Charakterbogen aktiviert, klicken Sie dieses Kästchen an (z. B. die leichte körperliche Konsequenz, die Sie bei Physique 5 erhalten).

Klicken Sie abschließend auf die Plus-Schaltfläche, um diese verknüpfte Fertigkeit zu erstellen.

Sie können z. B. mehrere Fertigkeitsspuren und Effekte hinzufügen:
Physischer Stress: Physique, Rang 1, 1 Kästchen; Physique, Rang 3, 1 Kästchen (für kumulativ 2 zusätzliche Kästchen).

### Fertigkeitspunkte gesamt
Dies ist die aktuelle Gesamtzahl der Fertigkeitspunkte aller PCs im Spiel. Bei einem Standard-Fate-Core-Spiel beginnt dies bei 20 Punkten.

### Freie Stunts
Wie viele Stunts erhält jeder PC, ohne Auffrischung ausgeben zu müssen? Die Standardanzahl ist 3 für Fate Core.

### Säule erzwingen
Wenn Sie dieses Kästchen ankreuzen, können Spieler ihre Fertigkeitenliste nicht speichern, wenn ihre Fertigkeiten nicht der Spaltenregel entsprechen (d.h. jeder Fertigkeitsrang muss die gleiche Anzahl oder weniger Fertigkeiten haben wie der Rang darunter).

### Fertigkeitenlimmit erzwingen
Wenn Sie dieses Kontrollkästchen aktivieren, können Spieler ihre Fertigkeitenliste nicht speichern, wenn sie mehr Fertigkeitspunkte verbraucht haben als die Gesamtsumme der Fertigkeitspunkte im Spiel.

### Ersetzen oder Löschen aller Weltfertigkeiten
Wählen Sie eine Liste, mit der Sie Ihre Welt initialisieren möchten: Fate Core, Condensed oder Accelerated. Dies setzt die Standardwerte für alle neu erstellten Charaktere, hat aber keine Auswirkungen auf bestehende Charaktere. Die Initialisierung wird durchgeführt, wenn Sie auf die Schaltfläche "Änderungen speichern" klicken.

### Ersetzen oder Löschen der Aspektliste
Wie oben, aber für die Aspekte des Spiels

### Ersetzen oder Löschen aller Weltspuren
Wie oben, aber für die Spuren des Spiels

### Aktualisieren gesamt
Die gesamte Auffrischung Ihres Spiels. Diese beginnt bei 3 in Fate Core.

## Charakterblatt
Wenn Sie einen Charakter erstellen, wird er mit einem Satz aller PC-Fertigkeiten auf Mittelmäßig (+0) und allen Universalspuren initialisiert. Sein Charakterblatt wird geöffnet und ebenso sein Fertigkeiten-Editor.

Die einem Charakter zugewiesenen Spuren, Aspekte und Fertigkeiten sind eine lokale Kopie. Wenn Sie zurückgehen und die Systemversionen davon bearbeiten, werden dadurch KEINE bestehenden Charaktere verändert. Wenn Sie eine Änderung an einer Systemeinstellung für eine Spur, eine Fertigkeit oder einen Aspekt vornehmen, die sich auf einen Charakter auswirken soll, löschen Sie einfach das entsprechende Objekt und fügen Sie es erneut hinzu, und es wird aktualisiert.

### Avatar
Klicken Sie auf den Avatar, um ein Avatarbild auszuwählen.

### Audit-Daten
Hier sehen Sie auf einen Blick die Auffrischung des Charakters, die aktuellen Schicksalspunkte, die Spielauffrischung, die Fertigkeitspunkte, die Summe der Spielfertigkeiten und die verbrauchte Auffrischung. Wenn Sie das Blatt eines PCs betrachten, wird das Spiel Sie warnen, wenn diese Berechnung nicht aufgeht und der Charakter mehr Auffrischung hat, als er sollte. 

Sie können den Mauszeiger über das Element "Refresh Spent" bewegen, um zu sehen, wie dies berechnet wurde. Wenn es in Ihrem Spiel 3 freie Stunts gibt, beginnt dies bei -3; dies ist normal.

### Blatt- und Biographie-Registerkarten-Symbole
Klicken Sie auf diese Symbole, um zwischen den Registerkarten für das Charakterblatt (Zwischenablage) und die Biografie (Gesicht) zu wechseln.

### Fertigkeiten-Editor
Sie können die Fertigkeiten hier nach Namen oder nach Rang sortieren, indem Sie auf die Sortierschaltfläche am unteren Rand klicken. Sie können dies tun, während Sie die Fertigkeiten ausfüllen, um zu überprüfen, ob sie in einer gültigen Formation sind (z.B. 1 Großartig, 2 Gut, 3 Mittelmäßig, 4 Durchschnittlich). Wenn Sie auf "Speichern" klicken, werden die Fertigkeiten dem Charakter zugewiesen und alle Spuren, für die der Charakter keine Fertigkeiten hat, werden aus dem Blatt entfernt.
Als Spielleiter können Sie auf die Schaltfläche "Bearbeiten" am unteren Rand dieses Fensters klicken, um Fertigkeiten für einen bestimmten Charakter hinzuzufügen oder zu entfernen oder um eine Ad-hoc-Fertigkeit hinzuzufügen, die nur für diesen Charakter gilt. Sie können hier auch Fertigkeiten hinzufügen, die Sie eingerichtet haben, ohne dass das PC-Kontrollkästchen aktiviert ist.

Um eine Ad-hoc-Fertigkeit hinzuzufügen, geben Sie einfach den Namen in das Feld am unteren Rand des Bildschirms ein und klicken Sie auf die Plus-Schaltfläche.

### Fertigkeitenliste
Sie können mit der rechten Maustaste auf einen Fertigkeitsnamen klicken, um die vom GM für diese Fertigkeit eingegebenen Informationen anzuzeigen.
Klicken Sie auf die Schaltfläche "Sortieren", um zwischen der Sortierung nach Rang oder nach Name zu wechseln.
Klicken Sie auf eine beliebige Stelle zwischen dem Fertigkeitsnamen und dem Würfelsymbol, um diese Fertigkeit zu würfeln.
Klicken Sie auf das Zahnradsymbol, um den Fertigkeitseditor zu öffnen.

### Aspekte
Hier können Sie den Text für jeden Aspekt eingeben.
Als Spielleiter können Sie auf das Zahnradsymbol klicken, um die Aspekte dieses Charakters zu bearbeiten. Sie können sie frei löschen, neu anordnen oder ihren Namen oder ihre Beschreibung im Aspekt-Editorfenster ändern.

### Spuren
Hier können Sie Felder und Aspekte markieren oder die Markierung aufheben. Sie können auch auf das Zahnrad-Symbol klicken, um weitere verfügbare Spuren zu Ihrem Charakter hinzuzufügen. Als Spielleiter können Sie jedem Charakter auch eine Ad-hoc-Spur für einzigartige Spuren hinzufügen; den Editor für Ad-hoc-Spuren kennen Sie bereits aus dem Menüpunkt Spur-Einstellung.

### Stunts
Klicken Sie auf das Plus, um einen Stunt hinzuzufügen.

Wenn ein Stunt eine verknüpfte Fertigkeit hat, können Sie auf ein Würfelsymbol klicken, um die verknüpfte Fertigkeit mit diesem Stunt zu würfeln, der in der Chatbox genannt wird.
Wenn er eine verknüpfte Fertigkeit hat und +2 angekreuzt ist, können Sie mit einem +2 würfeln, indem Sie auf das Würfelsymbol klicken.

Klicken Sie auf "Speichern", um den Stunt zu speichern.

Nach dem Speichern können Sie auf das Bearbeitungssymbol klicken, um einen Stunt zu bearbeiten, oder auf das Löschsymbol, um ihn zu löschen.

### Beschreibung
Auf der Registerkarte "Bio" befindet sich ein großes Textfeld, in das Sie die Beschreibung Ihres Charakters eintippen oder einfügen können, sowie ein weiteres Feld für seine Biografie. Diese werden während der Eingabe gespeichert. Sie können einfachen Rich Text mit ctrl-b, ctrl-i, ctr-u für fett, kursiv, unterstrichen verwenden.

### Extras
Klicken Sie auf das Plus-Symbol, um ein Extra hinzuzufügen, und dann auf die Schaltfläche "Bearbeiten", um es zu bearbeiten. Wenn das Extra Auffrischungskosten hat, werden diese zu den Auffrischungsausgaben des Charakters hinzugefügt. Wenn es keine Auffrischungskosten gibt, geben Sie unbedingt 0 als Kosten ein.

Ein nicht mehr benötigtes Extra können Sie mit dem Papierkorbsymbol löschen.

Wenn Sie ein Extra, einen Stunt, eine Fertigkeit oder eine Strecke auf ein Extra legen, wird es der Liste dieser Dinge des Charakters hinzugefügt, wenn das Extra ausgerüstet ist. Beim Entfernen oder Löschen des Extras werden die hinzugefügten Eigenschaften ebenfalls gelöscht. 

Fähigkeiten auf Extras wirken sich nicht auf Spurenkästen aus oder aktivieren Spuren. Wenn Sie dies benötigen, verwenden Sie eine Ad-hoc-Spur.

## Fate Utilities
Das FU-Fenster wird mit dem Theatermasken-Symbol auf der linken Seite des Bildschirms geöffnet, wenn Sie eine Szene betrachten.

Die erste FU-Registerkarte zeigt die Schicksalspunkte des GMs für die Szene an und bietet dem GM eine Taste zum Aktualisieren aller Schicksalspunkte.
Wenn die Szene Token hat, zeigt die erste Registerkarte alle Aspekte dieses Tokens für jeden an, der die Berechtigung "Begrenzt" oder besser für dieses Token hat, und solange das Token nicht versteckt ist.

Sie können auf ein Token-Porträt klicken, um zwischen der Anzeige von Token-Porträts und Darstellerporträts umzuschalten.

Wenn der Betrachter den Token besitzt, bietet die erste Registerkarte ein Dropdown-Feld, in dem Sie eine Fähigkeit (oder einen Stunt) auswählen und dann mit dieser Fähigkeit (oder diesem Stunt) würfeln können.

Die zweite FU-Registerkarte zeigt die Spuren für alle Token an, für die Sie die Berechtigung "Limited" oder besser haben, es sei denn, das Token ist ausgeblendet. Sie können diese Spuren markieren oder löschen, wenn Sie das Token besitzen.

Klicken Sie auf die Schaltfläche "Clear" (Löschen), um alle flüchtigen Spuren für alle Token in jeder Kategorie zu löschen.

Die dritte Registerkarte enthält ein Feld zum Hinzufügen eines Situationsaspekts mit einer Anzahl von freien Aufrufen.  Sie können so viele Situationsaspekte haben, wie Sie möchten, und diese werden auf der Szenenebene gespeichert.

Sie können auch die Szenennotizen bearbeiten, die für alle Spieler sichtbar sind. Dies ist eine großartige Möglichkeit, um epehmerische Informationen wie Verstärkungen oder Notizen über das Geschehen festzuhalten, wenn Sie eine Szene auf halbem Weg beenden müssen.

### Action Tracker
Sobald ein Charakter in einen Konflikt eingetreten ist (über das Standardsymbol auf dem Token), wird ein Action Tracker auf der rechten Seite des FU-Fensters hinzugefügt. Dieser zeigt alle Spielsteine an, die dem Konflikt beigetreten sind und nicht versteckt sind (versteckte Spielsteine werden dem GM angezeigt).

Klicken Sie auf das Porträt eines Charakters, um ihn seine Aktion für den Austausch ausführen zu lassen.
Klicken Sie auf die Schnellvorlauf-Schaltfläche, um zum nächsten Austausch vorzurücken
Klicken Sie auf das Uhrensymbol, um ein zeitgesteuertes Ereignis einzurichten, das bei einem bestimmten Austausch ausgelöst wird.
Klicken Sie auf das Papierkorbsymbol, um den Konflikt zu löschen.























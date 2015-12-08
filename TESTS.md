To test the OTU mapping features, use [Whitmore, 2013 on devtree](http://devtree.opentreeoflife.org/curator/study/edit/pg_2628?tab=otu-mapping). This has a number of non-standard taxon labels which should fail the standard "quick" mapping tool. Then try "Fuzzy matches" on the first few OTUs. Some (like _Sarcophaga mediterranea_) will fail to get even a fuzzy match, but most will return a list of possible matches. Clicking any match will accept it, just as if a single match had been accepted with the "check" button. Clicking the "X" rejects all the suggested matches.

Once you see a list of possible matches, click the "key" link to see a popup explaining the colors and opacity. Mousing over any match in a list will show the same information.

Back in the synth-tree viewer, you can confirm the presence of working taxon search (context list appears) on the [Contact page.](http://devtree.opentreeoflife.org/contact) 
 
Other changes (to visualization and resource downloads) should be available for review on **files.opentreeoflife.org**, since these are generally deployed immediately from the local repo, by the person who made the changes.

There is a test script for the `to_nexson` method (the service that converts and imports studies from uploaded files or pasted text) in [curator/test/test.sh](https://github.com/OpenTreeOfLife/opentree/blob/master/curator/test/test.sh).

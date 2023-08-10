// Queries all matches and loads them into an object
//---------------------------------------------------------------------------------------------------------------------------------------------------------
async function get_all_matches() {
    const url = `./json/data.json`;
    const query = await fetch(url);
    const response = await query.json();
    const data = response.map(index => index);
    
    console.log("Got all matches", data);
    return data;
}





// Queries all character names and IDs and loads them into an object
//---------------------------------------------------------------------------------------------------------------------------------------------------------
async function get_all_characters() {
    const url = `https://www.amiibots.com/api/utility/get_all_characters`;
    const query = await fetch(url);
    const response = await query.json();
    const data = response.data.map(index => index);
    
    console.log("Got all character names and ids", data);
    return data;
}





// SORTS THROUGH ALL MATCHES AND TALLIES UP ALL WINS/LOSSES PER CHARACTER
//---------------------------------------------------------------------------------------------------------------------------------------------------------
async function processMatchupData() {
    const all_matches = await get_all_matches(); 
    const all_characters = await get_all_characters();

    const completeMatchups = [];

    all_characters.forEach(e_character => {
        const dataToPush = {
            id: e_character.id,
            name: e_character.name,

            data: all_characters.map(character => ({
                name: character.name,
                id: character.id,
                wins: 0,
                losses: 0
            }))
        };

        all_matches.forEach(e_match => {
                if (e_character.id === e_match.winner_character_id) {
                    const opponentId = e_match.loser_character_id;
                    const opponentIndex = dataToPush.data.findIndex(opponent => opponent.id === opponentId);
                    if (opponentIndex !== -1) {
                        dataToPush.data[opponentIndex].wins++;
                    }
                } 
                
                if (e_character.id === e_match.loser_character_id) {
                    const opponentId = e_match.winner_character_id;
                    const opponentIndex = dataToPush.data.findIndex(opponent => opponent.id === opponentId);
                    if (opponentIndex !== -1) {
                        dataToPush.data[opponentIndex].losses++;
                }
            }
        });

        completeMatchups.push(dataToPush);

    });

    console.log(completeMatchups);
    
    async function downloadJSON() {
        const json = JSON.stringify(completeMatchups, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AmiibotsMatchupData.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // downloadJSON();
}
// processMatchupData();








// SORTS THROUGH ALL MATCHES AND CREATES THE DATA FOR THE HIGHEST RATING HISTORY
//---------------------------------------------------------------------------------------------------------------------------------------------------------
async function processHighestRatingHistory() {

    async function get_each_week() {
        const data = [];
        let weeklyMatches = [];
        let prevDate = 0;
        let currDate = 0;
        let totalWeeks = 0;
        let totalMatches = 0;
        
        const query = await fetch(`./json/data.json`);
        const response = await query.json();
    
        prevDate = new Date(response[0].created_at).toISOString().substring(0, 10);
    
        await response.reduce(async (previousPromise, index) => {
            await previousPromise;
    
            currDate = new Date(index.created_at).toISOString().substring(0, 10);
    
            let temp = new Date(currDate);
            let currDate7DaysAgo = new Date(temp.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
            if (currDate7DaysAgo === prevDate) {
                await pushData();
            }
            weeklyMatches.push(index);
            totalMatches++;
        }, Promise.resolve());
    
        await pushData();            

        async function pushData() {
            totalWeeks++;
            prevDate = currDate;
            // console.log(weeklyMatches);
            data.push(weeklyMatches);
            weeklyMatches = [];
            await delay(10); // Introduce a delay of 1 second
        }
        
        function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
    
        return data;
    }

    const combinedAmiibotsMatchData = await get_each_week();

    console.log(combinedAmiibotsMatchData);





// HIGHEST RATING HISTORY CODE
//---------------------------------------------------------------------------------------------------------------------------------------------------------
    async function createHighestRatingHistoryData(data) {
        const specifiedCharacter = data.id;

        let highestRatedHistory = [];
        let currentWeek = 0;

        // filter highest rated amiibo
        for (let i = combinedAmiibotsMatchData.length - 1; i > 0 ; i--) {
            currentWeek++;
            let highestRating = 0;
            let highestRatingindex = 0;
            for (x = combinedAmiibotsMatchData[i].length - 1; x > 0 ; x--) {
                if (combinedAmiibotsMatchData[i][x].winner_character_id == specifiedCharacter) {
                    if (combinedAmiibotsMatchData[i][x].winner_rating > highestRating) {
                        highestRating = combinedAmiibotsMatchData[i][x].winner_rating;
                        highestRatingindex = x;
                    }
                }

                if (combinedAmiibotsMatchData[i][x].loser_character_id == specifiedCharacter) {
                    if (combinedAmiibotsMatchData[i][x].loser_rating > highestRating) {
                        highestRating = combinedAmiibotsMatchData[i][x].loser_rating;
                        highestRatingindex = x;
                    }
                }
            }

            if (highestRating != 0) {
                if (highestRatedHistory.length == 0) {
                    if (combinedAmiibotsMatchData[i][highestRatingindex].winner_rating == highestRating) {
                        highestRatedHistory.push({
                            "trainer_name": combinedAmiibotsMatchData[i][highestRatingindex].winner_trainer_name,
                            "trainer_id": combinedAmiibotsMatchData[i][highestRatingindex].winner_trainer_id,
                            "amiibo_name": combinedAmiibotsMatchData[i][highestRatingindex].winner_name,
                            "unique_amiibo_id": combinedAmiibotsMatchData[i][highestRatingindex].winner_unique_amiibo_id,
                            "rating": combinedAmiibotsMatchData[i][highestRatingindex].winner_rating,
                            "current_week": currentWeek
                        });
                    }
        
                    if (combinedAmiibotsMatchData[i][highestRatingindex].loser_rating == highestRating) {
                        highestRatedHistory.push({
                            "trainer_name": combinedAmiibotsMatchData[i][highestRatingindex].loser_trainer_name,
                            "trainer_id": combinedAmiibotsMatchData[i][highestRatingindex].loser_trainer_id,
                            "amiibo_name": combinedAmiibotsMatchData[i][highestRatingindex].loser_name,
                            "unique_amiibo_id": combinedAmiibotsMatchData[i][highestRatingindex].loser_unique_amiibo_id,
                            "rating": combinedAmiibotsMatchData[i][highestRatingindex].loser_rating,
                            "current_week": currentWeek
                        });
                    }
                }

                if ((i < combinedAmiibotsMatchData.length - 1) && highestRating > highestRatedHistory[highestRatedHistory.length - 1].rating) {
                    if (combinedAmiibotsMatchData[i][highestRatingindex].winner_rating == highestRating) {
                        highestRatedHistory.push({
                            "trainer_name": combinedAmiibotsMatchData[i][highestRatingindex].winner_trainer_name,
                            "trainer_id": combinedAmiibotsMatchData[i][highestRatingindex].winner_trainer_id,
                            "amiibo_name": combinedAmiibotsMatchData[i][highestRatingindex].winner_name,
                            "unique_amiibo_id": combinedAmiibotsMatchData[i][highestRatingindex].winner_unique_amiibo_id,
                            "rating": combinedAmiibotsMatchData[i][highestRatingindex].winner_rating,
                            "current_week": currentWeek
                        });
                    }

                    if (combinedAmiibotsMatchData[i][highestRatingindex].loser_rating == highestRating) {
                        highestRatedHistory.push({
                            "trainer_name": combinedAmiibotsMatchData[i][highestRatingindex].loser_trainer_name,
                            "trainer_id": combinedAmiibotsMatchData[i][highestRatingindex].loser_trainer_id,
                            "amiibo_name": combinedAmiibotsMatchData[i][highestRatingindex].loser_name,
                            "unique_amiibo_id": combinedAmiibotsMatchData[i][highestRatingindex].loser_unique_amiibo_id,
                            "rating": combinedAmiibotsMatchData[i][highestRatingindex].loser_rating,
                            "current_week": currentWeek
                        });
                    }
                }

                if ((i < combinedAmiibotsMatchData.length - 1) && highestRating < highestRatedHistory[highestRatedHistory.length - 1].rating) {
                    highestRatedHistory.push({
                        "trainer_name": highestRatedHistory[highestRatedHistory.length - 1].trainer_name,
                        "trainer_id": highestRatedHistory[highestRatedHistory.length - 1].trainer_id,
                        "amiibo_name": highestRatedHistory[highestRatedHistory.length - 1].amiibo_name,
                        "unique_amiibo_id": highestRatedHistory[highestRatedHistory.length - 1].unique_amiibo_id,
                        "rating": highestRatedHistory[highestRatedHistory.length - 1].rating,
                        "current_week": currentWeek
                    });
                }
            }
        }

        const dataFinal = {
            'name': data.name,
            'id': data.id,
            'rating_history': highestRatedHistory
        }

        amiibotsRatingHistory.push(dataFinal);        
    }

    const amiibotsRatingHistory = [];
    const all_characters = await get_all_characters();
    all_characters.map(async function (e) {await createHighestRatingHistoryData(e)});
    console.log(amiibotsRatingHistory);
    
    async function downloadJSON() {
        const json = JSON.stringify(amiibotsRatingHistory, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AmiibotsRatingHistory.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // downloadJSON();

}
// processHighestRatingHistory();





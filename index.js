/**************
 * Twitter list grabber
 * Grabs tweets from all members of a list
 **************/
const fs = require('fs').promises;
const Twitter = require('twitter');
const bpromise = require('bluebird');

const listId = ''; // https://twitter.com/i/lists/<list id>
const apiKey = ''; // get from twitter developer
const apiSecret = ''; // get from twitter developer
const bearerToken = ''; // get from twitter developer

// Create client
const client = new Twitter({
	consumer_key: apiKey,
	consumer_secret: apiSecret,
	bearer_token: bearerToken,
});

// Get members from list
console.log('Get list members');
client.allow_promise = true;
client.get('lists/members', {
	list_id: listId,
	count: 5000, // maximum supported
})

	// Iterate members in list, create folder for storage, assemble array of fetching promises.
	.then(async data => {
		console.log(`Retrieved list members (${data.users.length}), creating folder ./${listId}`);
		await fs.mkdir(`./${listId}`);

		// Create a timeline fetch promise for each user in list
		return bpromise.map(data.users, user =>
			new Promise((res, rej) => {
				console.log(`==> Downloading for user ${user.name}(${user.screen_name})`);
				client.get('statuses/user_timeline', {
					screen_name: user.screen_name,
					count: 200, // maximum supported
				}, async (error, tweets, response) => {
					if (error) return rej(error);

					// Clean up tweet obj a little.
					tweets = tweets.map(tweet => ({
						id: tweet.id,
						text: tweet.text,
					}));

					await bpromise.each(tweets, async tweet => {
						console.log(`===> Save tweet ${tweet.id}`);
						await fs.writeFile(`./${listId}/${tweet.id}.txt`, tweet.text, 'utf-8');
					});

					console.log(`====> Download for ${user.name}(${user.screen_name}) complete.`);
					return res();
				})
			})
		);
	})
	.then(promises => {
	
		// Launch and complete all promises.
		return bpromise
			.all(promises)
			.then(() => console.log('Complete'))
			.catch(console.error);
	})
	.catch(console.error);
const request = require('./bin/request.js');
const url = require('url');
const qs = require('querystring');
const Promise = require('bluebird');

/**
 * @name Twitch
 * @description : Creates our twitch class
 * @param {Object<id, secret>} options : pases our client id and secret to the constructor
*/
function Twitch(options) {
    this.id = options.id;
    this.secret = options.secret;
}

/**
 * @method makeRequest
 * @description : makes a request to protocol http or https server with correct API headers
 * @param {String} http : passes an string to our request
 * @returns {Promise.<string, Error>} returns data from an http request;
*/
Twitch.prototype.makeRequest = function(http) {
    return new Promise((resolve, reject) => {
        // set the headers in our request
            let headers = {
              "Client-ID" : this.id,
              "Accept": "application/vnd.twitchtv.v5+json"
            };
            // use our request module to make a http request
            request.get(http, headers)
                .then(resolve)
                .catch(reject);
    });
}

/**
 * @method getUserId
 * @description : gets user id from username
 * @param {String} username
 * @returns {Promise.<string, Error>}
 */
Twitch.prototype.getUserId = function(username) {
    return new Promise((resolve, reject) => {
        // set URL for working with the api
        let url = `https://api.twitch.tv/kraken/users?login=${username}`;
        // make request
        this.makeRequest(url)
            .then(data => {
                let json = data;
                if (json.users[0] == null || json.users[0]._id == null) {
                    return cosnole.error(`The user ${username} seems to not exist`);
                }
                resolve(json.users[0]._id);
            }).catch(reject);
    });
}

/**
 * @method getUser
 * @description : gets user data from the api
 * @param {String} username : the username we want information from
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.getUser = function(username) {
    return new Promise((resolve, reject) => {
        this.getUserId(username)
            .then(userId => {
                // set our URL for working with the api
                let url = `https://api.twitch.tv/kraken/streams/${userId}`;
                // make request
                this.makeRequest(url)
                    .then(data => {
                        resolve(JSON.parse(data));
                    }).catch(reject);
                    
            }).catch(reject);
    });
}

/**
 * @method getFeaturedStreams
 * @description : Gets featured streams
 * @param {Object} options : optional query params
 * @param {Integer} options.limit : maximum number of objects in array {Default: 25} {Maximum: 100}
 * @param {Integer} options.offset : object offset for pagination {Default: 0}
 * @returns {Promise.<string, Error>} : resolve JSON data or rejects an error
*/
Twitch.prototype.getFeaturedStreams = function(options) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        let url = "https://api.twitch.tv/kraken/streams/featured"
        if(options) {
            url += `?${qs.stringify(options, '&', '=')}`;
        }
        // make our request
        this.makeRequest(url)
            .then(data => {
                resolve(JSON.parse(data));
            }).catch(reject);
    });
}

/**
 * @method getTopStreams
 * @description : Makes an api call to retrieve all top streams on twitch
 * @param {Object} options : optional query params
 * @param {String} options.channel : streams from a comma separated list of channels
 * @param {String} options.game : streams categorized under {game}
 * @param {String} options.language : only shows streams of a certain language. Permitted values are locale ID strings, e.g. {en}, {fi}, {es-mx}
 * @param {String} options.stream_type : only shows streams from a certain type. Permitted values: {all}, {playlist}, {live}
 * @param {Integer} options.limit : maximum number of objects in array {Default: 25} {Maximum: 100}
 * @param {Integer} options.offset : object offset for pagination {Default: 0}
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.getTopStreams = function(options) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        let url = "https://api.twitch.tv/kraken/streams";

        if(options) {
            url += `?${qs.stringify(options, '&', '=')}`;
        }
            // make our request
            this.makeRequest(url)
                .then(data => {
                    // resolve our data and parse as a JSON
                    resolve(JSON.parse(data));
                }).catch(reject);
        });
}

/**
 * @method getTopGames
 * @description : Makes an API call to top games on twitch
 * @param {Object} options : optional query params
 * @param {Integer} options.limit : maximum number of objects in array {Default: 25} {Maximum: 100}
 * @param {Integer} options.offset : object offset for pagination {Default: 0}
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.getTopGames = function(options) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        let url = "https://api.twitch.tv/kraken/games/top";

        if(options) {
            url += `?${qs.stringify(options, '&', '=')}`;
        }

        // make our request
        this.makeRequest(url)
            .then(data => {
                // resolve our data and parse as a JSON
                resolve(JSON.parse(data));
            }).catch(reject);
    });
}

/**
 * @method getUsersByGame
 * @description : searches users by game
 * @param {String} game : the game we want to search
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.getUsersByGame = function(game) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        let url = `https://api.twitch.tv/kraken/streams/?game=${game}`;
        // make our request
        this.makeRequest(url)
            .then(data => {
                // resolve our data and parse as a JSON
                resolve(JSON.parse(data));
            }).catch(reject);
    });
}

/**
 * @method getStreamUrl
 * @description : finds rtmp streams
 * @param {String} user : the user we want to search
 * @returns {Promise.<string, Error>} : resolves link
*/
Twitch.prototype.getStreamUrl = function(user) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        user = user.toLowerCase();
        let url = `http://api.twitch.tv/api/channels/${user}/access_token`;
        // make our request
        this.makeRequest(url)
            .then(data => {
                data = JSON.parse(data);
                let streamUrl = `http://usher.twitch.tv/api/channel/hls/${user}.m3u8?player=twitchweb&&token=${data.token}&sig=${data.sig}&allow_audio_only=true&allow_source=true&type=any&p={random}`

                if(data.error === "Not Found") {
                    return reject(data.error);
                } else {
                    return resolve(streamUrl);
                }
            }).catch(console.error)
    });
}

/**
 * @method searchChannels
 * @description : search for channels based on specified query parameter
 * @param {String} query : a channel is returned if the query parameter is matched entirely or partially, in the channel description or game name
 * @param {Integer} limit : maximum number of objects to return, sorted by number of followers {Default: 25} {Maximum: 100}
 * @param {Integer} offset : object offset for pagination of results {Default: 0}
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.searchChannels = function(query, limit = 25, offset = 0) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        query = encodeURIComponent(query);
        let url = `https://api.twitch.tv/kraken/search/channels?query=${query}&limit=${limit}&offset=${offset}`;
        // make our request
        this.makeRequest(url)
            .then(data => {
                // resolve our data and parse as a JSON
                resolve(JSON.parse(data));
            }).catch(reject);
    });
}

/**
 * @method searchStreams
 * @description : search for streams based on specified query parameter
 * @param {String} query : a stream is returned if the query parameter is matched entirely or partially, in the channel description or game name
 * @param {Integer} limit : maximum number of objects to return, sorted by number of followers {Default: 25} {Maximum: 100}
 * @param {Integer} offset : object offset for pagination of results {Default: 0}
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.searchStreams = function(query, limit = 25, offset = 0) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        query = encodeURIComponent(query);
        let url = `https://api.twitch.tv/kraken/search/streams?query=${query}&limit=${limit}&offset=${offset}`;
        // make our request
        this.makeRequest(url)
            .then(data => {
                // resolve our data and parse as a JSON
                resolve(JSON.parse(data));
            }).catch(reject);
    });
}

/**
 * @method searchGames
 * @description : search for games based on specified query parameter
 * @param {String} query : a url-encoded search query
 * @param {Boolean} live : if true, only returns games that are live on at least one channel  {Default: false}
 * @returns {Promise.<string, Error>} : resolves JSON data or rejects an error
*/
Twitch.prototype.searchGames = function(query, live = false) {
    return new Promise((resolve, reject) => {
        // set our URL for working with the api
        query = encodeURIComponent(query);
        let url = `https://api.twitch.tv/kraken/search/games?query=${query}&live=${live}`;
        // make our request
        this.makeRequest(url)
            .then(data => {
                // resolve our data and parse as a JSON
                resolve(JSON.parse(data));
            }).catch(reject);
    });
}

module.exports = Twitch;

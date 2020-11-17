const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();
// Return array of job listings
const scrapeListings = async (page) => {
	await page.goto('https://sfbay.craigslist.org/d/software-qa-dba-etc/search/sof');
	const html = await page.content();
	const $ = cheerio.load(html);

	const listings = $('.result-info')
		.map((index, element) => {
			const titleElement = $(element).find('.result-title');
			const timeElement = $(element).find('.result-date');
			const hoodElement = $(element).find('.result-hood');
			const datePosted = new Date($(timeElement).attr('datetime'));
			const title = $(titleElement).text(); // returns title text
			const hood = $(hoodElement).text().trim().replace('(', '').replace(')', '');
			const url = $(titleElement).attr('href'); // returns href attr of title class
			return { title, url, datePosted, hood }; // returns a mapped obj
		})
		.get();
	return listings;
};

const connect = async () => {
	await mongoose.connect(
		process.env.URI,
		{ useNewUrlParser: true },
		{ useUnifiedTopology: true }
	);
	console.log('connected to db...');
};

const scrapeDescriptions = async (listings, page) => {
	for (var i = 0; i < listings.length; i++) {
		await page.goto(listings[i].url);
		const html = await page.content();
		const $ = cheerio.load(html);
		const compensation = $('p.attrgroup > span:nth-child(1) > b').text();
		const jobDescription = $('#postingbody').text();
		listings[i].jobDescription = jobDescription;
		listings[i].compensation = compensation;
		console.log(listings[i].jobDescription);
		console.log(listings[i].compensation);
		await sleep(1000); // 1 second wait
	}
};

const sleep = async (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const main = async () => {
	await connect();
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	const listings = await scrapeListings(page);
	const listWithDescriptions = await scrapeDescriptions(listings, page);
	console.log(listings);
};

main();

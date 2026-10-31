import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEmailMetrics,
  formatEmailHtml,
  filterAlgerianOutros,
  generateDefaultCampaign,
  ALGERIAN_OUTRO_COLLECTION,
  ALGERIAN_DIALECTS,
  getDialectPromptInstructions,
  estimateAudioDuration,
} from './campaign.ts';

test('calculateEmailMetrics returns valid numbers and spam score boundaries', () => {
  const cleanSubject = 'Introducing our new spring collection';
  const cleanBody = 'We have designed handcrafted essentials tailored for modern creators. Enjoy sustainable quality and timeless silhouettes.';
  const metrics = calculateEmailMetrics(cleanSubject, cleanBody);

  assert.ok(metrics.wordCount > 10, 'word count should be positive');
  assert.ok(metrics.charCount > 50, 'character count should be positive');
  assert.ok(metrics.readingTimeSeconds >= 10, 'reading time should have minimum floor');
  assert.ok(metrics.spamScore >= 0 && metrics.spamScore <= 100, 'spam score bounded 0-100');
  assert.ok(metrics.predictedOpenRate >= 15 && metrics.predictedOpenRate <= 65, 'open rate prediction bounded');
});

test('calculateEmailMetrics penalizes spam keywords', () => {
  const spammy = calculateEmailMetrics('FREE CASH WINNER $$$ ACT NOW', 'Click here free guaranteed cash 100% winner');
  const normal = calculateEmailMetrics('Your monthly engineering briefing', 'Here are the updates from our team this sprint.');

  assert.ok(spammy.spamScore > normal.spamScore, 'Spammy text must receive higher spam score');
});

test('formatEmailHtml generates valid HTML with essential components', () => {
  const campaign = generateDefaultCampaign('Productivity tool');
  const html = formatEmailHtml(campaign);

  assert.ok(html.includes('<!DOCTYPE html>'), 'Must start with html5 doctype');
  assert.ok(html.includes(campaign.body.headline), 'Must include headline');
  assert.ok(html.includes(campaign.body.companyName), 'Must include company name');
  assert.ok(html.includes(campaign.body.cta.text), 'Must include primary CTA button');
  assert.ok(html.includes('Unsubscribe'), 'Must include unsubscribe link');
});

test('filterAlgerianOutros handles filtering by region and search query', () => {
  const allOutros = ALGERIAN_OUTRO_COLLECTION;
  assert.ok(allOutros.length >= 6, 'Should have at least 6 Algerian outro options');

  const algerOnly = filterAlgerianOutros(allOutros, 'العاصمي (الوسط)');
  assert.ok(algerOnly.length >= 1, 'Should find Alger outro');
  assert.equal(algerOnly[0].region, 'العاصمي (الوسط)');

  const searchResults = filterAlgerianOutros(allOutros, undefined, 'اللايك');
  assert.ok(searchResults.length >= 1, 'Search query should match text mentioning like/action');
});

test('ALGERIAN_DIALECTS contains the required 5 regional dialect keys', () => {
  const dialectIds = ALGERIAN_DIALECTS.map((d) => d.id);
  assert.ok(dialectIds.includes('general'), 'Must include general Darija');
  assert.ok(dialectIds.includes('algiers'), 'Must include Algiers');
  assert.ok(dialectIds.includes('eastern'), 'Must include Eastern');
  assert.ok(dialectIds.includes('western'), 'Must include Western');
  assert.ok(dialectIds.includes('sahara'), 'Must include Sahara / Traditional');
});

test('getDialectPromptInstructions returns tailored dialect instructions', () => {
  const algiers = getDialectPromptInstructions('algiers');
  assert.ok(algiers.includes('العاصمية'), 'Must mention Algiers dialect');

  const western = getDialectPromptInstructions('western');
  assert.ok(western.includes('الغربية'), 'Must mention Western dialect');

  const eastern = getDialectPromptInstructions('eastern');
  assert.ok(eastern.includes('الشرقية'), 'Must mention Eastern dialect');
});

test('estimateAudioDuration computes realistic speaking times', () => {
  const shortText = 'يعطيكم الصحة على المشاهدة خاوتي!';
  const duration = estimateAudioDuration(shortText);
  assert.ok(duration.includes('ثانية'), 'Must return Arabic second string');
});


/**
 * MASTER DATA — derived directly from Sheet2
 * This is the single source of truth.
 * Category = column header in Sheet2
 * Types    = column values under that header
 */

const MASTER_CATEGORIES = [
  'User_Behaviour',
  'Technical_Network',
  'STT_Issue',
  'Agent_Performance',
  'TTS_Pronunciation',
  'System_Detection',
  'Clean_Call',        // NEW: calls with no issues / good call flow
];

/**
 * TYPE_LOOKUP
 * Maps every possible raw type string (lowercased, trimmed) to:
 *   { type: <canonical Sheet2 type>, category: <canonical Sheet2 category> }
 *
 * Rules:
 * 1. Category from Sheet2 always wins over what the sheet wrote
 * 2. Ambiguous types (e.g. "not responding" appears in both User_Behaviour and Agent_Performance)
 *    are resolved using the CATEGORY_HINT from the sheet's category column
 */
const TYPE_LOOKUP = {
  // ────────── User_Behaviour ──────────
  'not interested':                        { type: 'Not Interested',             category: 'User_Behaviour' },
  'not responding':                        { type: 'Not Responding',             category: 'User_Behaviour' },
  'not responding right':                  { type: 'Not Responding',             category: 'User_Behaviour' },
  'not responding properly':               { type: 'Not Responding',             category: 'User_Behaviour' },
  'busy':                                  { type: 'Busy',                       category: 'User_Behaviour' },
  'disconnected early':                    { type: 'Disconnected Early',         category: 'User_Behaviour' },
  'user disconnected early':               { type: 'Disconnected Early',         category: 'User_Behaviour' },
  'user disconnectedearly':                { type: 'Disconnected Early',         category: 'User_Behaviour' },
  'disconnected mid-call':                 { type: 'Disconnected Mid-Call',      category: 'User_Behaviour' },
  'disconnected call mid-way':             { type: 'Disconnected Mid-Call',      category: 'User_Behaviour' },
  'wrong number':                          { type: 'Wrong Number',               category: 'User_Behaviour' },
  'already taken admission':               { type: 'Already Taken Admission',    category: 'User_Behaviour' },
  'already completed':                     { type: 'Already Doing / Completed',  category: 'User_Behaviour' },
  'already admitted elsewhere':            { type: 'Already Doing / Completed',  category: 'User_Behaviour' },
  'already doing / completed':             { type: 'Already Doing / Completed',  category: 'User_Behaviour' },
  'user pursuing other course':            { type: 'User pursuing other Course', category: 'User_Behaviour' },
  'ineligible':                            { type: 'Ineligible',                 category: 'User_Behaviour' },
  'user not eligible.':                    { type: 'Ineligible',                 category: 'User_Behaviour' },
  'user not eligible':                     { type: 'Ineligible',                 category: 'User_Behaviour' },
  'different intent':                      { type: 'Different Intent',           category: 'User_Behaviour' },
  'user not available':                    { type: 'User Not Available',         category: 'User_Behaviour' },
  'not available':                         { type: 'User Not Available',         category: 'User_Behaviour' },
  'user not understanding':                { type: 'User Not Understanding',     category: 'User_Behaviour' },
  'low user voice':                        { type: 'Low User Voice',             category: 'User_Behaviour' },
  'language barrier':                      { type: 'Language Barrier',           category: 'User_Behaviour' },
  'stopped responding mid-call':           { type: 'Stopped Responding Mid-Call',category: 'User_Behaviour' },
  'stopped respoding mid-call':            { type: 'Stopped Responding Mid-Call',category: 'User_Behaviour' },

  // ────────── Technical_Network ──────────
  'user network issue':                    { type: 'User Network Issue',         category: 'Technical_Network' },

  // ────────── STT_Issue ──────────
  'agent transcribing into another language': { type: 'Agent Transcribing into another language', category: 'STT_Issue' },
  'wrong transcription':                   { type: 'Wrong Transcription',        category: 'STT_Issue' },
  'transcription':                         { type: 'Wrong Transcription',        category: 'STT_Issue' },
  'transcript issue':                      { type: 'Wrong Transcription',        category: 'STT_Issue' },
  'wrongful extraction':                   { type: 'Wrong Transcription',        category: 'STT_Issue' },
  'not able to identify what user said':   { type: 'Wrong Transcription',        category: 'STT_Issue' },

  // ────────── Agent_Performance ──────────
  'auto language switch':                  { type: 'Auto Language Switch',       category: 'Agent_Performance' },
  'automatic language switch':             { type: 'Auto Language Switch',       category: 'Agent_Performance' },
  'language switching':                    { type: 'Auto Language Switch',       category: 'Agent_Performance' },
  'agent giving wrong info':               { type: 'Agent Giving Wrong Info',    category: 'Agent_Performance' },
  'hallucination':                         { type: 'Agent Giving Wrong Info',    category: 'Agent_Performance' },
  'agent not understanding':               { type: 'Agent Giving Wrong Info',    category: 'Agent_Performance' },
  'conversation starter':                  { type: 'Conversation Starter',       category: 'Agent_Performance' },
  'welcome message sounded unnatural / robotic': { type: 'Welcome Message Unnatural / Robotic', category: 'Agent_Performance' },
  'welcome message unnatural / robotic':   { type: 'Welcome Message Unnatural / Robotic', category: 'Agent_Performance' },
  'language handling':                     { type: 'Language Handling',          category: 'Agent_Performance' },
  'eligibility not handled':               { type: 'Eligibility Not Handled',    category: 'Agent_Performance' },
  'objection not handled':                 { type: 'Objection Not Handled',      category: 'Agent_Performance' },
  'interrupt handling':                    { type: 'Objection Not Handled',      category: 'Agent_Performance' },
  'interruption handling':                 { type: 'Objection Not Handled',      category: 'Agent_Performance' },
  'agent self-id':                         { type: 'Agent Self-ID',              category: 'Agent_Performance' },
  'repetition':                            { type: 'Repetition',                 category: 'Agent_Performance' },
  'stuck in loop':                         { type: 'Repetition',                 category: 'Agent_Performance' },
  'city / campus':                         { type: 'City / Campus',              category: 'Agent_Performance' },
  'callback time not asked':               { type: 'Callback Time Not Asked',    category: 'Agent_Performance' },
  'callback date not asked':               { type: 'Callback Time Not Asked',    category: 'Agent_Performance' },
  'callback date/time not asked':          { type: 'Callback Time Not Asked',    category: 'Agent_Performance' },
  'callback date/time':                    { type: 'Callback Time Not Asked',    category: 'Agent_Performance' },
  'callback date&time not asked':          { type: 'Callback Time Not Asked',    category: 'Agent_Performance' },
  'callback not flagged':                  { type: 'Callback Time Not Asked',    category: 'Agent_Performance' },
  'agent disconnected mid-question':       { type: 'Agent Disconnected Mid-Question', category: 'Agent_Performance' },
  'agent disconnected midway':             { type: 'Agent Disconnected Mid-Question', category: 'Agent_Performance' },
  'agent disconnected':                    { type: 'Agent Disconnected Mid-Question', category: 'Agent_Performance' },
  'agent cut the call in-between':         { type: 'Agent Disconnected Mid-Question', category: 'Agent_Performance' },
  'out of context response':               { type: 'Out of Context Response',    category: 'Agent_Performance' },
  'premature closure':                     { type: 'Premature Closure',          category: 'Agent_Performance' },
  'premature call closure':                { type: 'Premature Closure',          category: 'Agent_Performance' },
  'closure not followed properly':         { type: 'Premature Closure',          category: 'Agent_Performance' },
  'abrupt ending':                         { type: 'Premature Closure',          category: 'Agent_Performance' },
  'abrupt end':                            { type: 'Premature Closure',          category: 'Agent_Performance' },
  'call end abruptly':                     { type: 'Premature Closure',          category: 'Agent_Performance' },
  'missing exam instructions':             { type: 'Missing Exam Instructions',  category: 'Agent_Performance' },
  'missing venue info':                    { type: 'Missing Venue Info',         category: 'Agent_Performance' },
  'agent disconnected while user was speaking': { type: 'Agent Disconnected While User Was Speaking', category: 'Agent_Performance' },
  'agent not stopping when user is saying something': { type: 'Agent Disconnected While User Was Speaking', category: 'Agent_Performance' },
  'premature closure moved to closing mid-question': { type: 'Premature Closure', category: 'Agent_Performance' },
  'agent speaking shudh hindi':            { type: 'Agent Speaking Shudh Hindi', category: 'Agent_Performance' },
  'shudh hindi':                           { type: 'Agent Speaking Shudh Hindi', category: 'Agent_Performance' },
  'agent not following call flow':         { type: 'Agent Not Following Call Flow', category: 'Agent_Performance' },
  'script deviation':                      { type: 'Agent Not Following Call Flow', category: 'Agent_Performance' },
  'violation of scope':                    { type: 'Agent Not Following Call Flow', category: 'Agent_Performance' },
  'violation of prompt directive':         { type: 'Agent Not Following Call Flow', category: 'Agent_Performance' },
  'unecessary followup':                   { type: 'Agent Not Following Call Flow', category: 'Agent_Performance' },
  'unecessary script follow':              { type: 'Agent Not Following Call Flow', category: 'Agent_Performance' },
  'wrong closure':                         { type: 'Premature Closure',          category: 'Agent_Performance' },
  'agent speaking fast initially':         { type: 'Agent Speaking Fast',        category: 'Agent_Performance' },
  'agent speaking fast midspeech':         { type: 'Agent Speaking Fast',        category: 'Agent_Performance' },
  'agent closing speech is fast':          { type: 'Agent Speaking Fast',        category: 'Agent_Performance' },
  'agent speaking fast':                   { type: 'Agent Speaking Fast',        category: 'Agent_Performance' },
  'agent not responding':                  { type: 'Agent Not Responding',       category: 'Agent_Performance' },
  'agent not able to store the values':    { type: 'Agent Not Able to Store Values', category: 'Agent_Performance' },
  'latency':                               { type: 'Latency',                    category: 'Agent_Performance' },
  'latency issue':                         { type: 'Latency',                    category: 'Agent_Performance' },
  'latency error':                         { type: 'Latency',                    category: 'Agent_Performance' },
  'no waiting time':                       { type: 'Latency',                    category: 'Agent_Performance' },

  // ────────── TTS_Pronunciation ──────────
  'hindi word in english call':            { type: 'Hindi Word in English Call', category: 'TTS_Pronunciation' },
  'fees mispronounced':                    { type: 'Fees Mispronounced',         category: 'TTS_Pronunciation' },
  'number / word mispronounced':           { type: 'Number / Word Mispronounced',category: 'TTS_Pronunciation' },
  'location pronunciation':                { type: 'Location Pronunciation',     category: 'TTS_Pronunciation' },
  'pronunciation issue':                   { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'pronounciation':                        { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'mispronounciation':                     { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'mispronunciation':                      { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'name and location mispronounciation':   { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'tone issue':                            { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'accent issue':                          { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },
  'college name':                          { type: 'Pronunciation Issue',        category: 'TTS_Pronunciation' },

  // ────────── System_Detection ──────────
  'duplicate call':                        { type: 'Duplicate Call',             category: 'System_Detection' },
  'voicemail detected':                    { type: 'Voicemail Detected',         category: 'System_Detection' },
  'voicemail detection':                   { type: 'Voicemail Detected',         category: 'System_Detection' },
  'voicemail not detected':                { type: 'Voicemail Detected',         category: 'System_Detection' },
  'not able to detect voicemail':          { type: 'Voicemail Detected',         category: 'System_Detection' },
  'recorded message / ivr':               { type: 'Recorded Message / IVR',     category: 'System_Detection' },
  'recorded message':                      { type: 'Recorded Message / IVR',     category: 'System_Detection' },
  'not able to detect recorded message':   { type: 'Recorded Message / IVR',     category: 'System_Detection' },
  'call auto-disconnect':                  { type: 'Call Auto-Disconnect',       category: 'System_Detection' },
  'disconnected issue':                    { type: 'Call Auto-Disconnect',       category: 'System_Detection' },
  'auto disconnected mid call':            { type: 'Call Auto-Disconnect',       category: 'System_Detection' },
  'auto disconnected call':                { type: 'Call Auto-Disconnect',       category: 'System_Detection' },
  'agent did not speak but came in the transcript': { type: 'Agent Did Not Speak (In Transcript)', category: 'System_Detection' },
  'agent did not speak but came in transcript':     { type: 'Agent Did Not Speak (In Transcript)', category: 'System_Detection' },
};

/**
 * Ambiguous types that need the sheet's category as a hint.
 * Key = lowercased type, value = map of sheet-cat-hint → resolution
 */
const AMBIGUOUS_TYPES = {
  'not responding': {
    'agent_performance': { type: 'Agent Not Responding',  category: 'Agent_Performance' },
    'agent performance': { type: 'Agent Not Responding',  category: 'Agent_Performance' },
    'default':           { type: 'Not Responding',        category: 'User_Behaviour' },
  },
  'voicemail detected': {
    'default': { type: 'Voicemail Detected', category: 'System_Detection' },
  },
  'voicemail detection': {
    'default': { type: 'Voicemail Detected', category: 'System_Detection' },
  },
  'disconnected early': {
    'system_detection': { type: 'Call Auto-Disconnect',  category: 'System_Detection' },
    'system detection':  { type: 'Call Auto-Disconnect',  category: 'System_Detection' },
    'default':           { type: 'Disconnected Early',   category: 'User_Behaviour' },
  },
  'transcription': {
    'default': { type: 'Wrong Transcription', category: 'STT_Issue' },
  },
  'user issue': {
    'technical/network':  { type: 'User Network Issue',   category: 'Technical_Network' },
    'technical_network':  { type: 'User Network Issue',   category: 'Technical_Network' },
    'default':            { type: 'User Not Understanding', category: 'User_Behaviour' },
  },
};

/**
 * Canonical category aliases (raw category string → canonical list)
 * Returns array because some entries like "Agent Performance, User Behaviour" mean multiple categories.
 */
function normalizeCategories(raw) {
  if (!raw) return [];
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  const map = {
    'user behaviour':                  ['User_Behaviour'],
    'user behavior':                   ['User_Behaviour'],
    'user_behaviour':                  ['User_Behaviour'],
    'user_behavior':                   ['User_Behaviour'],
    'user behavious':                  ['User_Behaviour'],
    'user behaviour, agent performance': ['User_Behaviour', 'Agent_Performance'],
    'agent performance, user behaviour': ['Agent_Performance', 'User_Behaviour'],
    'agent performance':               ['Agent_Performance'],
    'agent_performance':               ['Agent_Performance'],
    'agent performace':                ['Agent_Performance'],
    'agent performace/pronounciation': ['Agent_Performance', 'TTS_Pronunciation'],
    'agent performace/pronunciation':  ['Agent_Performance', 'TTS_Pronunciation'],
    'agent performace':                ['Agent_Performance'],
    'agent behavious':                 ['Agent_Performance'],
    'agent behaviour':                 ['Agent_Performance'],
    'agent performance, system detection': ['Agent_Performance', 'System_Detection'],
    'agent performance, system_detection': ['Agent_Performance', 'System_Detection'],
    'agent performance, system detection': ['Agent_Performance', 'System_Detection'],
    'agent performance, system detection': ['Agent_Performance', 'System_Detection'],
    'system detection':                ['System_Detection'],
    'system_detection':                ['System_Detection'],
    'stt_issue':                       ['STT_Issue'],
    'stt_issue, agent_performance':    ['STT_Issue', 'Agent_Performance'],
    'stt':                             ['STT_Issue'],
    'tts_pronunciation':               ['TTS_Pronunciation'],
    'tts / pronunciation':             ['TTS_Pronunciation'],
    'tts/pronunciation':               ['TTS_Pronunciation'],
    'tts':                             ['TTS_Pronunciation'],
    'technical_network':               ['Technical_Network'],
    'technical/network':               ['Technical_Network'],
    'technical network':               ['Technical_Network'],
    'mutiple issues':                  ['Multiple_Issues'],
    'multiple issues':                 ['Multiple_Issues'],
    'multiple_issues':                 ['Multiple_Issues'],
  };
  return map[key] || [];
}

/**
 * Main export: given a raw row, returns array of {type, category} pairs.
 * Handles:
 *  - Case normalization
 *  - Comma-separated multi-issue cells
 *  - Ambiguous types (uses sheet category as hint)
 *  - "Many Type of Issues" / Adamas special case
 * Rows with no category AND no type are already filtered out in sheetsService.
 */
function normalizeRow(rawCategory, rawType, manualQc, missedByAi) {
  const catHint = (rawCategory || '').trim().toLowerCase();
  const rawTypeTrimmed = (rawType || '').trim();

  // ── Skip if both empty (shouldn't reach here, filtered in sheetsService) ──
  if (!rawCategory && !rawType) return [];

  // ── Skip explicit NA ──
  if (rawTypeTrimmed.toLowerCase() === 'na' || rawTypeTrimmed.toLowerCase() === 'x') {
    return [];
  }

  // ── Adamas / "Many Type of Issues" special case ──
  if (rawTypeTrimmed.toLowerCase() === 'many type of issues' || catHint.includes('mutiple') || catHint.includes('multiple')) {
    return [{ type: 'Multiple Issues (Unclassified)', category: 'Multiple_Issues' }];
  }

  // ── No type but has category ──
  if (!rawTypeTrimmed) {
    // Try to use the category itself — e.g. "System_Detection" with empty type
    // Just skip these rows since we can't determine the type
    return [];
  }

  // ── Split comma-separated multi-issue cells ──
  // Split on comma but NOT inside parentheses
  const parts = rawTypeTrimmed.split(',').map(p => p.trim()).filter(p => p && p.toLowerCase() !== 'x');

  const results = [];
  const seen = new Set();

  for (const part of parts) {
    const key = part.toLowerCase().trim().replace(/\.$/, ''); // strip trailing dot

    // Check ambiguous first
    if (AMBIGUOUS_TYPES[key]) {
      const resolution =
        AMBIGUOUS_TYPES[key][catHint] ||
        AMBIGUOUS_TYPES[key][catHint.replace(/\s+/g, '_')] ||
        AMBIGUOUS_TYPES[key]['default'];
      const dedup = resolution.type + '|' + resolution.category;
      if (!seen.has(dedup)) { seen.add(dedup); results.push({ ...resolution }); }
      continue;
    }

    // Direct lookup
    if (TYPE_LOOKUP[key]) {
      const r = TYPE_LOOKUP[key];
      const dedup = r.type + '|' + r.category;
      if (!seen.has(dedup)) { seen.add(dedup); results.push({ ...r }); }
      continue;
    }

    // ── Fuzzy fallback: try partial match ──
    const fuzzyKey = Object.keys(TYPE_LOOKUP).find(k =>
      key.includes(k) || k.includes(key) && key.length > 4
    );
    if (fuzzyKey) {
      const r = TYPE_LOOKUP[fuzzyKey];
      const dedup = r.type + '|' + r.category;
      if (!seen.has(dedup)) { seen.add(dedup); results.push({ ...r }); }
      continue;
    }

    // ── Last resort: use sheet's category + original type (title-cased) ──
    const sheetCats = normalizeCategories(rawCategory);
    const guessedCategory = sheetCats[0] || 'Agent_Performance';
    const titleCased = part.replace(/\b\w/g, c => c.toUpperCase());
    const dedup = titleCased + '|' + guessedCategory;
    if (!seen.has(dedup)) {
      seen.add(dedup);
      results.push({ type: titleCased, category: guessedCategory });
    }
  }

  return results;
}

module.exports = { MASTER_CATEGORIES, TYPE_LOOKUP, normalizeRow, normalizeCategories };

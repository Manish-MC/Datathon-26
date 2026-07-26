import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from string import punctuation
from collections import defaultdict
import os
import re

_nltk_data_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "nltk_data"
)
if os.path.isdir(_nltk_data_dir):
    nltk.data.path.insert(0, _nltk_data_dir)

# Minimal built-in fallback so the app NEVER crashes even if NLTK data
# is completely unavailable (no bundled folder, no internet access).
_FALLBACK_STOPWORDS = {
    "i","me","my","myself","we","our","ours","ourselves","you","your","yours",
    "yourself","yourselves","he","him","his","himself","she","her","hers","herself",
    "it","its","itself","they","them","their","theirs","themselves","what","which",
    "who","whom","this","that","these","those","am","is","are","was","were","be",
    "been","being","have","has","had","having","do","does","did","doing","a","an",
    "the","and","but","if","or","because","as","until","while","of","at","by","for",
    "with","about","against","between","into","through","during","before","after",
    "above","below","to","from","up","down","in","out","on","off","over","under",
    "again","further","then","once","here","there","when","where","why","how","all",
    "any","both","each","few","more","most","other","some","such","no","nor","not",
    "only","own","same","so","than","too","very","s","t","can","will","just","don",
    "should","now"
}

_nltk_ready = False


def download_nltk_data():
    """Attempt to ensure NLTK data is available. Never raises — on failure,
    the app falls back to simple whitespace tokenization + built-in stopwords."""
    global _nltk_ready
    required = [
        'tokenizers/punkt',
        'tokenizers/punkt_tab',
        'corpora/stopwords',
        'taggers/averaged_perceptron_tagger_eng',
        'chunkers/maxent_ne_chunker_tab',
        'corpora/words',
    ]
    missing = []
    for path in required:
        try:
            nltk.data.find(path)
        except LookupError:
            missing.append(path)

    if not missing:
        _nltk_ready = True
        return

    try:
        print(f"NLTK data missing ({missing}); attempting download...")
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('averaged_perceptron_tagger_eng', quiet=True)
        nltk.download('maxent_ne_chunker_tab', quiet=True)
        nltk.download('words', quiet=True)

        # Re-check after attempting download
        for path in required:
            nltk.data.find(path)
        _nltk_ready = True
    except Exception as e:
        print(f"WARNING: NLTK data unavailable ({e}). "
              f"Falling back to basic tokenization/stopwords — NLP quality will be reduced.")
        _nltk_ready = False


def _safe_word_tokenize(text: str):
    if _nltk_ready:
        try:
            return word_tokenize(text)
        except Exception:
            pass
    # Fallback: simple regex-based word split
    return re.findall(r"\b\w+\b", text)


def _safe_sent_tokenize(text: str):
    if _nltk_ready:
        try:
            return sent_tokenize(text)
        except Exception:
            pass
    # Fallback: naive split on sentence-ending punctuation
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s for s in sentences if s]


def _get_stopwords():
    if _nltk_ready:
        try:
            return set(stopwords.words('english') + list(punctuation))
        except Exception:
            pass
    return set(_FALLBACK_STOPWORDS) | set(punctuation)


class ExtractiveSummarizer:
    def __init__(self, target_sentences=3):
        self.target_sentences = target_sentences
        download_nltk_data()
        self.stop_words = _get_stopwords()

    def _redact_names(self, sentence: str) -> str:
        if not _nltk_ready:
            return sentence
        try:
            words = word_tokenize(sentence)
            tagged = nltk.pos_tag(words)
            chunked = nltk.ne_chunk(tagged)

            new_s = []
            for chunk in chunked:
                if hasattr(chunk, 'label') and chunk.label() == 'PERSON':
                    new_s.append('[PERSON]')
                elif hasattr(chunk, 'label'):
                    new_s.append(' '.join(c[0] for c in chunk))
                else:
                    new_s.append(chunk[0])

            return " ".join(new_s).replace(" .", ".").replace(" ,", ",").replace(" '", "'")
        except Exception:
            return sentence

    def summarize(self, text: str) -> str:
        if not text or len(text.strip()) == 0:
            return ""

        sentences = _safe_sent_tokenize(text)

        # 1. Word Frequency Calculation
        word_frequencies = defaultdict(int)
        for word in _safe_word_tokenize(text.lower()):
            if word not in self.stop_words:
                word_frequencies[word] += 1

        # Normalize frequencies
        max_freq = max(word_frequencies.values()) if word_frequencies else 1
        for word in word_frequencies.keys():
            word_frequencies[word] = word_frequencies[word] / max_freq

        # 2. Sentence Scoring
        sentence_scores = defaultdict(float)
        for i, sentence in enumerate(sentences):
            for word in _safe_word_tokenize(sentence.lower()):
                if word in word_frequencies:
                    sentence_scores[i] += word_frequencies[word]

        # 3. Pick top N sentences
        num_sentences = min(len(sentences), self.target_sentences)
        top_sentence_indices = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]

        selected_sentences = [sentences[i] for i in sorted(top_sentence_indices)]

        # 4. Categorize and Redact
        what = []
        who = []
        when_where = []

        for s in selected_sentences:
            s_redacted = self._redact_names(s)
            s_lower = s.lower()

            if any(w in s_lower for w in ['complainant', 'suspect', 'victim', 'thieves', 'burglar', 'resident', 'neighbour', 'unidentified', 'person']):
                who.append(s_redacted)
            elif any(w in s_lower for w in ['am', 'pm', 'morning', 'evening', 'night', 'july', 'january', 'date', 'on', 'between', 'during']):
                when_where.append(s_redacted)
            else:
                what.append(s_redacted)

        if not what and len(who) > 1:
            what.append(who.pop(0))
        if not what and len(when_where) > 1:
            what.append(when_where.pop(0))

        sections = []
        if what:
            sections.append(f"What happened: {' '.join(what)}")
        if who:
            sections.append(f"Who's involved: {' '.join(who)}")
        if when_where:
            sections.append(f"Key location/time facts: {' '.join(when_where)}")

        if not sections:
            return " ".join([self._redact_names(s) for s in selected_sentences])

        return " → ".join(sections)


class TransformerSummarizer:
    def __init__(self):
        pass

    def summarize(self, text: str) -> str:
        pass


default_summarizer = None


def generate_summary(text: str) -> str:
    global default_summarizer
    if default_summarizer is None:
        default_summarizer = ExtractiveSummarizer(target_sentences=3)
    return default_summarizer.summarize(text)
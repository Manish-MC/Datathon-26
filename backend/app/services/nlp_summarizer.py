import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from string import punctuation
from collections import defaultdict
import os

# Ensure nltk data is downloaded
def download_nltk_data():
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
        nltk.data.find('chunkers/maxent_ne_chunker_tab')
    except LookupError:
        print("Downloading NLTK data (punkt, stopwords, ner)...")
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('averaged_perceptron_tagger_eng', quiet=True)
        nltk.download('maxent_ne_chunker_tab', quiet=True)
        nltk.download('words', quiet=True)

class ExtractiveSummarizer:
    def __init__(self, target_sentences=3):
        self.target_sentences = target_sentences
        # Only try to download if we haven't already in this process
        download_nltk_data()
        self.stop_words = set(stopwords.words('english') + list(punctuation))
        
    def _redact_names(self, sentence: str) -> str:
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
            
            # naive detokenization to fix punctuation spacing
            return " ".join(new_s).replace(" .", ".").replace(" ,", ",").replace(" '", "'")
        except Exception:
            return sentence
            
    def summarize(self, text: str) -> str:
        if not text or len(text.strip()) == 0:
            return ""
            
        sentences = sent_tokenize(text)
        
        # 1. Word Frequency Calculation
        word_frequencies = defaultdict(int)
        for word in word_tokenize(text.lower()):
            if word not in self.stop_words:
                word_frequencies[word] += 1
                
        # Normalize frequencies
        max_freq = max(word_frequencies.values()) if word_frequencies else 1
        for word in word_frequencies.keys():
            word_frequencies[word] = word_frequencies[word] / max_freq
            
        # 2. Sentence Scoring
        sentence_scores = defaultdict(float)
        for i, sentence in enumerate(sentences):
            for word in word_tokenize(sentence.lower()):
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
            
            # Simple heuristic classification
            if any(w in s_lower for w in ['complainant', 'suspect', 'victim', 'thieves', 'burglar', 'resident', 'neighbour', 'unidentified', 'person']):
                who.append(s_redacted)
            elif any(w in s_lower for w in ['am', 'pm', 'morning', 'evening', 'night', 'july', 'january', 'date', 'on', 'between', 'during']):
                when_where.append(s_redacted)
            else:
                what.append(s_redacted)
                
        # Fallback if categories are empty
        if not what and len(who) > 1:
            what.append(who.pop(0))
        if not what and len(when_where) > 1:
            what.append(when_where.pop(0))
            
        # 5. Format Output
        sections = []
        if what:
            sections.append(f"What happened: {' '.join(what)}")
        if who:
            sections.append(f"Who's involved: {' '.join(who)}")
        if when_where:
            sections.append(f"Key location/time facts: {' '.join(when_where)}")
            
        # If everything fell into one bucket or we failed to categorize well, 
        # just list it out as one thing if sections is empty
        if not sections:
            return " ".join([self._redact_names(s) for s in selected_sentences])
            
        return " → ".join(sections)

# For future when we swap to an LLM
class TransformerSummarizer:
    def __init__(self):
        pass
    def summarize(self, text: str) -> str:
        pass

# Expose a default summarizer instance
default_summarizer = ExtractiveSummarizer(target_sentences=3)

def generate_summary(text: str) -> str:
    return default_summarizer.summarize(text)

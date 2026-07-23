import nltk
# Download required models
nltk.download('maxent_ne_chunker', quiet=True)
nltk.download('words', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('punkt', quiet=True)

text = "Pradeep Naik locked his house on July 9th evening and went to visit relatives. Divya Gowda states that Vikram K entered the premises."
sentences = nltk.sent_tokenize(text)

for s in sentences:
    words = nltk.word_tokenize(s)
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
            
    print(" ".join(new_s))

"""Score cached audio embeddings against the vocabulary.

Raw CLAP similarities are not comparable across different words -- some phrases
sit closer to all audio than others -- so a raw argmax over the vocabulary picks
whichever word is generically closest, not the one that describes this sample.
Each word is therefore z-scored across the corpus first: the question becomes
"is this sample unusually 'kick' compared to how 'kick' scores generally".
"""
import sys, os, json, numpy as np

def main(embfile, vocabfile, out=None, topn=2):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import torch, laion_clap
    z = np.load(embfile, allow_pickle=True)
    emb, files, kinds = z['embeddings'], z['files'], z['kinds']
    vocab = {k: v for k, v in json.load(open(vocabfile)).items() if not k.startswith('_')}
    words, facet_of = [], {}
    for facet, ws in vocab.items():
        for w in ws:
            words.append(w); facet_of[w] = facet

    model = laion_clap.CLAP_Module(enable_fusion=False)
    model.load_ckpt()
    with torch.no_grad():
        temb = np.asarray(model.get_text_embedding(words, use_tensor=False))
    temb = temb / (np.linalg.norm(temb, axis=1, keepdims=True) + 1e-12)

    sim = emb @ temb.T                      # samples x words, raw cosine
    zs = (sim - sim.mean(axis=0)) / (sim.std(axis=0) + 1e-9)   # per-word z-score

    results = []
    for i, f in enumerate(files):
        entry = {'file': str(f), 'window': str(kinds[i]), 'facets': {}}
        for facet in vocab:
            idx = [j for j, w in enumerate(words) if facet_of[w] == facet]
            order = sorted(idx, key=lambda j: -zs[i, j])[:topn]
            entry['facets'][facet] = [{'label': words[j], 'z': round(float(zs[i, j]), 2)} for j in order]
        results.append(entry)
    if out:
        json.dump(results, open(out, 'w'), indent=1)
    return results

if __name__ == '__main__':
    res = main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    for r in res:
        name = '/'.join(r['file'].split('/')[-2:])
        top = {f: v[0]['label'] for f, v in r['facets'].items()}
        print(f"{name:<24} [{r['window']:<13}] {top['instrument']:<26} {top['material']:<12} {top['articulation']:<26} {top['character']:<12} {top['mood']}")

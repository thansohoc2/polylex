export interface WordAnalysisSection {
  title: string;
  summary: string | null;
  examples: string[];
}

export interface WordAnalysisResult {
  term: string;
  languageCode: string;
  nuance: WordAnalysisSection;
  nounForms?: WordAnalysisSection | null;
  verbForms?: WordAnalysisSection | null;
  adjectiveForms?: WordAnalysisSection | null;
  adverbForms?: WordAnalysisSection | null;
  tenseUsage?: WordAnalysisSection | null;
  prepositions?: WordAnalysisSection | null;
  phrasalVerbs?: WordAnalysisSection | null;
  collocations?: WordAnalysisSection | null;
}

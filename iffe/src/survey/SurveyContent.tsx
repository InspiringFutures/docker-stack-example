export interface Content {
    readonly type: SurveyContent["type"];
    id: string;
    title?: string;
    description?: string;
}

export interface SectionHeader extends Content {
    readonly type: "SectionHeader";
}

export interface TextBlock extends Content {
    readonly type: "TextBlock";
}

export interface TextQuestion extends Content {
    readonly type: "TextQuestion";
    placeholder?: string;
}

export interface YesNoQuestion extends Content {
    readonly type: "YesNoQuestion";
}

export interface ParagraphQuestion extends Content {
    readonly type: "ParagraphQuestion";
    placeholder?: string;
}


type SurveyContent = SectionHeader | TextBlock | TextQuestion | YesNoQuestion | ParagraphQuestion;

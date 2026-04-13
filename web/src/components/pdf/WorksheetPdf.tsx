import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FDFBF7",
    color: "#1F2937",
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 42,
    paddingBottom: 44,
    paddingHorizontal: 42,
  },
  header: {
    alignItems: "flex-start",
    borderBottom: "1 solid #D7D2C7",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
  },
  brandBlock: {
    flexDirection: "column",
    gap: 4,
    maxWidth: 320,
  },
  brand: {
    color: "#0B2E4A",
    fontFamily: "Times-Bold",
    fontSize: 14,
    letterSpacing: 0.8,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 8.5,
  },
  fieldBlock: {
    alignItems: "flex-end",
    gap: 4,
  },
  field: {
    borderBottom: "1 solid #9CA3AF",
    color: "#374151",
    fontSize: 9,
    minWidth: 150,
    paddingBottom: 2,
    textAlign: "left",
  },
  title: {
    color: "#0B2E4A",
    fontFamily: "Times-Bold",
    fontSize: 18,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  pill: {
    backgroundColor: "#EDF2F7",
    border: "0.8 solid #D6DEE8",
    borderRadius: 999,
    color: "#47617B",
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  context: {
    backgroundColor: "#F3EEE5",
    border: "0.8 solid #E6DFD1",
    borderRadius: 6,
    color: "#374151",
    fontSize: 10,
    lineHeight: 1.55,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  sectionHeading: {
    color: "#0B2E4A",
    fontFamily: "Times-Bold",
    fontSize: 12,
    marginBottom: 8,
  },
  problem: {
    backgroundColor: "#FFFFFF",
    border: "0.8 solid #E5E7EB",
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  problemTop: {
    flexDirection: "row",
    gap: 8,
  },
  problemNumber: {
    color: "#0B2E4A",
    fontFamily: "Times-Bold",
    fontSize: 12,
    width: 16,
  },
  problemBody: {
    flex: 1,
  },
  prompt: {
    color: "#111827",
    fontSize: 10.2,
    lineHeight: 1.5,
  },
  optionsBlock: {
    gap: 5,
    marginTop: 7,
  },
  optionRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
  },
  optionCircle: {
    border: "1 solid #9CA3AF",
    borderRadius: 999,
    height: 10,
    marginTop: 1,
    width: 10,
  },
  optionText: {
    color: "#374151",
    flex: 1,
    fontSize: 9.8,
    lineHeight: 1.4,
  },
  answerLinesBlock: {
    gap: 8,
    marginTop: 8,
  },
  answerLine: {
    borderBottom: "1 solid #D1D5DB",
    height: 13,
    width: "100%",
  },
  answerBox: {
    border: "1 solid #D1D5DB",
    borderRadius: 4,
    height: 26,
    marginTop: 8,
  },
  visualWrap: {
    alignItems: "center",
    marginTop: 8,
  },
  answerKeyRow: {
    borderBottom: "0.6 solid #E5E7EB",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
  },
  answerKeyNumber: {
    color: "#47617B",
    fontFamily: "Times-Bold",
    fontSize: 11,
    width: 18,
  },
  answerKeyAnswer: {
    color: "#111827",
    flex: 1,
    fontSize: 10,
    lineHeight: 1.45,
  },
  footer: {
    borderTop: "0.8 solid #E5E7EB",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 42,
    paddingTop: 6,
    position: "absolute",
    right: 42,
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 8,
  },
});

export interface WorksheetProblem {
  id: number;
  type: string;
  prompt: string;
  visual?: { type: string; params: Record<string, unknown> } | null;
  visualImageSrc?: string | null;
  visualImageWidth?: number | null;
  visualImageHeight?: number | null;
  options?: string[] | null;
  answer?: string;
  answerLines?: number;
}

export interface WorksheetAnswerKeyEntry {
  problemId: number;
  answer: string;
}

export interface WorksheetContent {
  context: string;
  problems: WorksheetProblem[];
  answerKey: WorksheetAnswerKeyEntry[];
}

export interface WorksheetPdfProps {
  title: string;
  clusterTitle: string;
  grade: string;
  subject: string;
  worksheetNum: number;
  worksheetType: string;
  standardCodes: string[];
  content: WorksheetContent;
}

function getWorksheetLabel(worksheetNum: number, worksheetType: string) {
  if (worksheetNum === 1) return "Identify";
  if (worksheetNum === 2) return "Practice";
  if (worksheetNum === 3) return "Extend";
  return worksheetType.replace(/_/g, " ");
}

function getAnswerLineCount(problem: WorksheetProblem) {
  if (typeof problem.answerLines === "number" && problem.answerLines > 0) {
    return problem.answerLines;
  }

  if (problem.type === "multiple_choice") return 0;
  if (problem.type === "identify_visual" || problem.type === "label_diagram") {
    return 1;
  }

  if (
    problem.type === "word_problem" ||
    problem.type === "explain_your_thinking" ||
    problem.type === "create_example" ||
    problem.type === "short_answer"
  ) {
    return 3;
  }

  return 1;
}

function getVisualSource(problem: WorksheetProblem) {
  if (!problem.visualImageSrc) return null;

  return {
    src: problem.visualImageSrc,
    width: problem.visualImageWidth ?? 320,
    height: problem.visualImageHeight ?? 120,
  };
}

function WorksheetFooter({ standardCodes }: { standardCodes: string[] }) {
  const codesLabel =
    standardCodes.length > 0
      ? standardCodes.slice(0, 5).join(", ") +
        (standardCodes.length > 5 ? " ..." : "")
      : "Standards aligned worksheet";

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>The Sage&apos;s Compass</Text>
      <Text style={styles.footerText}>{codesLabel}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
      />
    </View>
  );
}

export function WorksheetPdf({
  title,
  clusterTitle,
  grade,
  subject,
  worksheetNum,
  worksheetType,
  standardCodes,
  content,
}: WorksheetPdfProps) {
  const worksheetLabel = getWorksheetLabel(worksheetNum, worksheetType);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>The Sage&apos;s Compass</Text>
            <Text style={styles.subtitle}>
              {clusterTitle} · {worksheetLabel}
            </Text>
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.field}>Name:</Text>
            <Text style={styles.field}>Date:</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.pill}>Grade {grade}</Text>
          <Text style={styles.pill}>{subject}</Text>
          <Text style={styles.pill}>{worksheetLabel}</Text>
        </View>

        <Text style={styles.context}>{content.context}</Text>

        <Text style={styles.sectionHeading}>Problems</Text>
        {content.problems.map((problem, index) => {
          const visual = getVisualSource(problem);
          const lineCount = getAnswerLineCount(problem);

          return (
            <View key={`${problem.id}-${index}`} style={styles.problem}>
              <View style={styles.problemTop}>
                <Text style={styles.problemNumber}>{index + 1}.</Text>
                <View style={styles.problemBody}>
                  <Text style={styles.prompt}>{problem.prompt}</Text>

                  {visual && (
                    <View style={styles.visualWrap}>
                      <Image
                        src={visual.src}
                        style={{
                          height: visual.height,
                          width: visual.width,
                        }}
                      />
                    </View>
                  )}

                  {!visual && problem.visual && (
                    <Text style={{ color: "#6B7280", fontSize: 8.8, marginTop: 6 }}>
                      Diagram available in the interactive worksheet set.
                    </Text>
                  )}

                  {problem.options && problem.options.length > 0 && (
                    <View style={styles.optionsBlock}>
                      {problem.options.map((option, optionIndex) => (
                        <View
                          key={`${problem.id}-option-${optionIndex}`}
                          style={styles.optionRow}
                        >
                          <View style={styles.optionCircle} />
                          <Text style={styles.optionText}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {problem.type === "identify_visual" && lineCount === 1 ? (
                    <View style={styles.answerBox} />
                  ) : lineCount > 0 ? (
                    <View style={styles.answerLinesBlock}>
                      {Array.from({ length: lineCount }, (_, lineIndex) => (
                        <View
                          key={`${problem.id}-line-${lineIndex}`}
                          style={styles.answerLine}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}

        <WorksheetFooter standardCodes={standardCodes} />
      </Page>

      {content.answerKey.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>The Sage&apos;s Compass</Text>
              <Text style={styles.subtitle}>Answer key</Text>
            </View>
          </View>

          <Text style={styles.title}>{title} · Answer Key</Text>
          {content.answerKey.map((entry) => (
            <View key={entry.problemId} style={styles.answerKeyRow}>
              <Text style={styles.answerKeyNumber}>{entry.problemId}.</Text>
              <Text style={styles.answerKeyAnswer}>{entry.answer}</Text>
            </View>
          ))}

          <WorksheetFooter standardCodes={standardCodes} />
        </Page>
      )}
    </Document>
  );
}

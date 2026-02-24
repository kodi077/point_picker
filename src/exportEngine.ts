import { AnchorPoint, ExportLanguage } from './types';

export function formatPoints(points: ReadonlyArray<AnchorPoint>, language: ExportLanguage): string {
  switch (language) {
    case 'json': {
      const items = points.map((p) =>
        `    { "pointName": "${p.pointName}", "xAnchor": ${p.xAnchor.toFixed(3)}, "yAnchor": ${p.yAnchor.toFixed(3)} }`
      );
      return `{\n  "points": [\n${items.join(',\n')}\n  ]\n}`;
    }

    case 'dart': {
      const items = points.map((p) =>
        `  Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
      );
      return `final List<Points> points = [\n${items.join('\n')}\n];\n\nclass Points {\n  final String pointName;\n  final double xAnchor;\n  final double yAnchor;\n  const Points(this.pointName, this.xAnchor, this.yAnchor);\n}`;
    }

    case 'swift': {
      const items = points.map((p) =>
        `  Points(pointName: "${p.pointName}", xAnchor: ${p.xAnchor.toFixed(3)}, yAnchor: ${p.yAnchor.toFixed(3)}),`
      );
      return `let points: [Points] = [\n${items.join('\n')}\n]\n\nstruct Points {\n  let pointName: String\n  let xAnchor: Double\n  let yAnchor: Double\n}`;
    }

    case 'java': {
      const items = points.map((p) =>
        `  new Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)})`
      );
      return `List<Points> points = Arrays.asList(\n${items.join(',\n')}\n);\n\npublic class Points {\n  public String pointName;\n  public double xAnchor;\n  public double yAnchor;\n  public Points(String pointName, double xAnchor, double yAnchor) {\n    this.pointName = pointName;\n    this.xAnchor = xAnchor;\n    this.yAnchor = yAnchor;\n  }\n}`;
    }

    case 'javascript': {
      const items = points.map((p) =>
        `  new Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
      );
      return `const points = [\n${items.join('\n')}\n];\n\nclass Points {\n  constructor(pointName, xAnchor, yAnchor) {\n    this.pointName = pointName;\n    this.xAnchor = xAnchor;\n    this.yAnchor = yAnchor;\n  }\n}`;
    }

    case 'typescript': {
      const items = points.map((p) =>
        `  { pointName: "${p.pointName}", xAnchor: ${p.xAnchor.toFixed(3)}, yAnchor: ${p.yAnchor.toFixed(3)} },`
      );
      return `interface IPoints { pointName: string; xAnchor: number; yAnchor: number; }\n\nconst points: IPoints[] = [\n${items.join('\n')}\n];`;
    }

    case 'kotlin': {
      const items = points.map((p) =>
        `  Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
      );
      return `val points = listOf(\n${items.join('\n')}\n)\n\ndata class Points(val pointName: String, val xAnchor: Double, val yAnchor: Double)`;
    }

    case 'python': {
      const items = points.map((p) =>
        `  Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
      );
      return `from dataclasses import dataclass\nfrom typing import List\n\n@dataclass\nclass Points:\n  point_name: str\n  x_anchor: float\n  y_anchor: float\n\npoints: List[Points] = [\n${items.join('\n')}\n]`;
    }

    case 'csharp': {
      const items = points.map((p) =>
        `  new Points("${p.pointName}", ${p.xAnchor.toFixed(3)}, ${p.yAnchor.toFixed(3)}),`
      );
      return `var points = new List<Points> {\n${items.join('\n')}\n};\n\npublic record Points(string PointName, double XAnchor, double YAnchor);`;
    }
  }
}

export function getFileExtension(language: ExportLanguage): string {
  const map: Record<ExportLanguage, string> = {
    json: '.json',
    dart: '.dart',
    swift: '.swift',
    java: '.java',
    javascript: '.js',
    typescript: '.ts',
    kotlin: '.kt',
    python: '.py',
    csharp: '.cs',
  };
  return map[language];
}

export function downloadFile(content: string, language: ExportLanguage): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'points' + getFileExtension(language);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

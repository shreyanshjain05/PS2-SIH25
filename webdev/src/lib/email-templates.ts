const DEPT_COLORS = {
  "Health Dept": "#138808", // India Green
  "Traffic Police": "#000080", // Navy Blue
  "Education Board": "#FF9933", // Saffron
  "Industrial Control": "#8B0000", // Dark Red
  default: "#333333",
};

const DEPT_ICONS = {
  "Health Dept": "🏥",
  "Traffic Police": "🚦",
  "Education Board": "🎓",
  "Industrial Control": "🏭",
};

export function generateEmailHtml(data: {
  department: string;
  title: string;
  regionName: string;
  category: string;
  pollutant: string;
  forecast: string;
  riskFactors: string[];
  suggestions: string[];
}) {
  const color =
    DEPT_COLORS[data.department as keyof typeof DEPT_COLORS] ||
    DEPT_COLORS["default"];
  const icon = DEPT_ICONS[data.department as keyof typeof DEPT_ICONS] || "📢";

  // Styles for inline usage
  const styles = {
    body: "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;",
    container:
      "max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);",
    header: `background-color: ${color}; color: #ffffff; padding: 20px; text-align: center;`,
    headerIcon: "font-size: 40px; margin-bottom: 10px;",
    headerTitle: "margin: 0; font-size: 24px; font-weight: bold;",
    deptName:
      "font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-top: 5px;",
    content: "padding: 30px;",
    alertBox: `background-color: ${
      data.category === "Severe" ? "#f8d7da" : "#fff3cd"
    }; border-left: 5px solid ${
      data.category === "Severe" ? "#dc3545" : "#ffc107"
    }; color: ${
      data.category === "Severe" ? "#721c24" : "#856404"
    }; padding: 15px; margin-bottom: 20px; border-radius: 4px;`,
    sectionTitle: `color: ${color}; font-size: 18px; font-weight: 600; margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #eee; padding-bottom: 5px;`,
    infoTable:
      "width: 100%; border-collapse: separate; border-spacing: 10px 10px; margin-bottom: 20px;",
    infoItem:
      "background: #f8f9fa; padding: 10px; border-radius: 4px; width: 48%; vertical-align: top;",
    infoLabel:
      "font-size: 12px; color: #666; text-transform: uppercase; display: block; margin-bottom: 4px;",
    infoValue: "font-weight: 600; font-size: 16px; margin: 0;",
    list: "margin: 0; padding-left: 20px;",
    listItem: "margin-bottom: 8px;",
    actionBox: `background-color: ${color}10; padding: 15px; border-radius: 4px; border-left: 3px solid ${color};`,
    footer:
      "background-color: #333; color: #fff; text-align: center; padding: 15px; font-size: 12px;",
    button: `display: inline-block; background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; text-align: center;`,
    buttonContainer: "text-align: center; margin-top: 20px;",
  };

  // Helper for severity color
  const severityColor = data.category === "Severe" ? "#dc3545" : "#ffc107";

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pollution Alert</title>
    </head>
    <body style="${styles.body}">
        <div style="${styles.container}">
            <!-- Header -->
            <div style="${styles.header}">
                <div style="${styles.headerIcon}">${icon}</div>
                <h1 style="${styles.headerTitle}">Pollution Alert System</h1>
                <div style="${styles.deptName}">For ${data.department}</div>
            </div>

            <!-- Content -->
            <div style="${styles.content}">
                <!-- Alert Box -->
                <div style="${styles.alertBox}">
                    <strong>⚠️ ALERT:</strong> ${data.title}
                </div>

                <!-- Info Grid (Using Table for Email Compatibility) -->
                <table style="${styles.infoTable}" role="presentation">
                    <tr>
                        <td style="${styles.infoItem}">
                            <span style="${styles.infoLabel}">Region</span>
                            <p style="${styles.infoValue}">${
    data.regionName
  }</p>
                        </td>
                        <td style="${styles.infoItem}">
                            <span style="${styles.infoLabel}">Severity</span>
                            <p style="${
                              styles.infoValue
                            }; color: ${severityColor}">${data.category}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="${styles.infoItem}">
                            <span style="${styles.infoLabel}">Pollutant</span>
                            <p style="${styles.infoValue}">${data.pollutant}</p>
                        </td>
                        <td style="${styles.infoItem}">
                            <span style="${styles.infoLabel}">Forecast</span>
                            <p style="${styles.infoValue}">${data.forecast}</p>
                        </td>
                    </tr>
                </table>

                <!-- Health Risks -->
                <div style="${styles.sectionTitle}">Health Risks</div>
                <ul style="${styles.list}">
                    ${data.riskFactors
                      .map(
                        (risk) => `<li style="${styles.listItem}">${risk}</li>`
                      )
                      .join("")}
                </ul>

                <!-- Action Plan -->
                <div style="${styles.sectionTitle}">Action Plan for ${
    data.department
  }</div>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid ${color};">
                    <ul style="${styles.list}">
                        ${data.suggestions
                          .map(
                            (suggestion) =>
                              `<li style="${styles.listItem}">${suggestion}</li>`
                          )
                          .join("")}
                    </ul>
                </div>

                <!-- Button -->
                <div style="${styles.buttonContainer}">
                    <a href="#" style="${styles.button}">Acknowledge Alert</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="${styles.footer}">
                &copy; ${new Date().getFullYear()} Government Pollution Control Board<br>
                Official Communication • Priority: High
            </div>
        </div>
    </body>
    </html>
    `;
}

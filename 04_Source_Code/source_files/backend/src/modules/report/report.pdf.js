import PDFDocument from 'pdfkit'

const colors = {
  ink: '#0f172a',
  muted: '#64748b',
  line: '#dbe4ee',
  cyan: '#0891b2',
  soft: '#f1f5f9',
  white: '#ffffff',
}

function text(value) {
  return String(value ?? '-')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7E]/g, '')
}

function ensureSpace(doc, height) {
  if (doc.y + height > doc.page.height - 60) {
    doc.addPage()
    return true
  }
  return false
}

function section(doc, title, subtitle, minimumBodyHeight = 0) {
  ensureSpace(doc, (subtitle ? 58 : 38) + minimumBodyHeight)
  doc.moveDown(0.7)
  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(colors.ink)
    .text(text(title), 50, doc.y, { width: 495 })
  if (subtitle) {
    doc
      .moveDown(0.2)
      .font('Helvetica')
      .fontSize(9)
      .fillColor(colors.muted)
      .text(text(subtitle), 50, doc.y, { width: 495 })
  }
  doc.moveDown(0.5)
  doc.strokeColor(colors.line).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.7)
}

function metric(doc, x, y, width, label, value) {
  doc.roundedRect(x, y, width, 58, 7).fill(colors.soft)
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(colors.muted)
    .text(text(label), x + 12, y + 11, {
      width: width - 24,
    })
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(colors.ink)
    .text(text(value), x + 12, y + 28, { width: width - 24 })
}

function tableHeader(doc, columns) {
  const y = doc.y
  doc.rect(50, y, 495, 25).fill(colors.ink)
  let x = 58
  for (const column of columns) {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(colors.white)
      .text(column.label, x, y + 8, { width: column.width - 8 })
    x += column.width
  }
  doc.y = y + 25
  doc.x = 50
}

function tableRow(doc, columns, values, index) {
  const movedToNextPage = ensureSpace(doc, 27)
  if (movedToNextPage) tableHeader(doc, columns)
  const y = doc.y
  if (index % 2 === 0) doc.rect(50, y, 495, 25).fill('#f8fafc')
  let x = 58
  values.forEach((value, valueIndex) => {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.ink)
      .text(text(value), x, y + 8, { width: columns[valueIndex].width - 8, ellipsis: true })
    x += columns[valueIndex].width
  })
  doc.y = y + 25
}

export function createReportPdf(report, output) {
  const isWeekly = report.reportType === 'weekly'
  const reportTitle = isWeekly ? 'Weekly Performance Report' : 'Performance Report'
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: {
      Title: `${reportTitle} - ${text(report.handle)}`,
      Author: 'CP Pulse',
    },
  })
  doc.pipe(output)

  doc.rect(0, 0, doc.page.width, 150).fill(colors.ink)
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#67e8f9').text('CP PULSE', 50, 44)
  doc.fontSize(27).fillColor(colors.white).text(reportTitle, 50, 66)
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#cbd5e1')
    .text(`Codeforces handle: ${text(report.handle)}`, 50, 105)
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString('en-US')}`, 50, 121)
  doc.y = 175

  const weaknessTopics = report.topicAnalysis || []
  const overallWeakness = weaknessTopics.length
    ? Math.round(
        weaknessTopics.reduce((sum, topic) => sum + topic.weakness * topic.attempted, 0) /
          Math.max(
            1,
            weaknessTopics.reduce((sum, topic) => sum + topic.attempted, 0),
          ),
      )
    : 0
  const metrics = [
    ['Current rating', report.profile?.rating ?? 'Unrated'],
    ['Problems solved', report.summary?.solvedProblems ?? 0],
    ['Problem AC rate', `${report.summary?.acRate ?? 0}%`],
    ['Weakness score', `${overallWeakness}/100`],
  ]
  metrics.forEach(([label, value], index) => metric(doc, 50 + index * 124, 175, 115, label, value))
  doc.y = 250

  if (isWeekly) {
    const comparison = report.weeklyComparison
    section(doc, 'Weekly change', 'Compared with your previous weekly report.')
    if (comparison?.hasBaseline) {
      const weeklyMetrics = [
        ['Solved change', `${comparison.solvedChange >= 0 ? '+' : ''}${comparison.solvedChange}`],
        ['Rating change', `${comparison.ratingChange >= 0 ? '+' : ''}${comparison.ratingChange}`],
        [
          'Weakness change',
          `${comparison.weaknessChange > 0 ? '+' : ''}${comparison.weaknessChange}`,
        ],
      ]
      const y = doc.y
      weeklyMetrics.forEach(([label, value], index) =>
        metric(doc, 50 + index * 165, y, 155, label, value),
      )
      doc.y = y + 65
    } else {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(colors.muted)
        .text(
          'This is your first weekly snapshot. Future reports will show week-over-week changes.',
          {
            width: 495,
          },
        )
      doc.moveDown(0.5)
    }
  }

  section(doc, 'Topic weakness', 'Higher scores indicate greater practice priority.')
  const topicColumns = [
    { label: 'Topic', width: 210 },
    { label: 'Attempted', width: 75 },
    { label: 'Solved', width: 65 },
    { label: 'AC rate', width: 65 },
    { label: 'Weakness', width: 80 },
  ]
  tableHeader(doc, topicColumns)
  weaknessTopics
    .slice(0, 10)
    .forEach((topic, index) =>
      tableRow(
        doc,
        topicColumns,
        [topic.topic, topic.attempted, topic.solved, `${topic.rate}%`, topic.weakness],
        index,
      ),
    )

  const populatedRatingBands = (report.ratingAnalysis || []).filter((band) => band.attempted)
  section(
    doc,
    'Rating bands',
    'Conversion and retry pressure by problem difficulty.',
    25 + populatedRatingBands.length * 25,
  )
  const ratingColumns = [
    { label: 'Range', width: 130 },
    { label: 'Attempted', width: 90 },
    { label: 'Solved', width: 80 },
    { label: 'AC rate', width: 85 },
    { label: 'Avg attempts', width: 110 },
  ]
  tableHeader(doc, ratingColumns)
  populatedRatingBands.forEach((band, index) =>
    tableRow(
      doc,
      ratingColumns,
      [band.bucket, band.attempted, band.solved, `${band.rate}%`, band.avg],
      index,
    ),
  )

  const upsolvingProblems = (report.upsolvingProblems || []).slice(0, 8)
  const problemColumns = [
    { label: 'Problem', width: 250 },
    { label: 'Rating', width: 70 },
    { label: 'Priority', width: 75 },
    { label: 'Tags', width: 100 },
  ]
  section(
    doc,
    'Upsolving priority',
    'Attempted problems that still have no accepted submission.',
    25 + upsolvingProblems.length * 25,
  )
  tableHeader(doc, problemColumns)
  upsolvingProblems.forEach((problem, index) =>
    tableRow(
      doc,
      problemColumns,
      [
        problem.name,
        problem.rating ?? 'Unrated',
        problem.priority,
        (problem.tags || []).slice(0, 3).join(', '),
      ],
      index,
    ),
  )

  const range = doc.bufferedPageRange()
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index)
    doc.page.margins.bottom = 20
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.muted)
      .text(`CP Pulse | ${text(report.handle)}`, 50, doc.page.height - 35, {
        width: 300,
        lineBreak: false,
      })
    doc.text(`Page ${index + 1} of ${range.count}`, 400, doc.page.height - 35, {
      width: 145,
      align: 'right',
      lineBreak: false,
    })
  }

  doc.end()
  return doc
}

const AWS = require('aws-sdk')

/**
 * @typedef {{
 *  critical: number,
 *  high: number,
 *  medium: number,
 *  low: number,
 *  informational: number,
 *  undefined: number,
 *  total: number }} IgnoredCounts
 */

/**
 * Get paginated AWS JS SDK results
 * @param {*} fn
 * @author https://advancedweb.hu/how-to-paginate-the-aws-js-sdk-using-async-generators/
 */
const getPaginatedResults = async (fn) => {
  const EMPTY = Symbol('empty');
  const res = [];
  for await (const lf of (async function*() {
    let NextMarker = EMPTY;
    while (NextMarker || NextMarker === EMPTY) {
      const { marker, results } = await fn(NextMarker !== EMPTY ? NextMarker : undefined);
      yield* results;
      NextMarker = marker;
    }
  })()) {
    res.push(lf);
  }
  return res;
};

/**
 * @param {AWS.ECR} ECR
 * @param {string} repository
 * @param {string} tag
 * @returns {AWS.Request|AWS.AWSError|null} Results, Error or `null`.
 */
const getFindings = async (ECR, repository, tag) => {
  return ECR.describeImageScanFindings({
    imageId: {
      imageTag: tag
    },
    repositoryName: repository
  }).promise().catch(
    (err) => {
      if (err.code === 'ScanNotFoundException') { return null }
      throw err
    })
}

/**
 * Method to collect all scan results.
 * @param {AWS.ECR} ECR
 * @param {string} repository
 * @param {string} tag
 * @returns {AWS.ECR.ImageScanFinding[]|AWS.AWSError|null} Results, Error or `null`.
 */
const getAllFindings = async (ECR, repository, tag) => {
  return await getPaginatedResults(async (NextMarker) => {
    const findings = await ECR.describeImageScanFindings({
      imageId: {
        imageTag: tag
      },
      maxResults: 1000, // Valid range: 1-1000, default: 100
      repositoryName: repository,
      nextToken: NextMarker
    }).promise().catch(
      (err) => {
        if (err.code === 'ScanNotFoundException') { return null }
        throw err
      })

    return {
      marker: findings.nextToken,
      results: findings.imageScanFindings.findings,
    };
  })
};

/**
 * Tally findings by severity.
 * @param {AWS.ECR.ImageScanFinding[]} ignoredFindings
 * @returns {IgnoredCounts} counts
 */
const countIgnoredFindings = (ignoredFindings) =>
  ignoredFindings.reduce(
    (counts, finding) => {
      const updatedCount = { ...counts }
      const severity = finding.severity.toLowerCase()
      updatedCount[severity]++
      updatedCount.total++
      return updatedCount
    },
    { critical: 0, high: 0, medium: 0, low: 0, informational: 0, undefined: 0, total: 0 }
  )

/**
 * Returns display text for a severity level.
 * @param {keyof IgnoredCounts} severity
 * @param {IgnoredCounts} counts
 * @returns {string}
 */
const getCount = (severity, counts) =>
  counts[severity] ? `(${counts[severity]} ignored)` : ''

/**
 * Build an array with CVE IDs to ignore in the counts.
 * @param {string | string[]} list - Comma/space/newline-separated list or array of CVE IDs.
 * @returns {string[]} Array of CVE IDs
 */
const parseIgnoreList = (list) => {
  if (Array.isArray(list)) return list // when GitHub Actions allow arrays to be passed in.
  if (!list) return []

  const ignoreList =
    list
      .trim() // remove trailing newlines if any
      .replace(/\n|\s/g, ',') // replace newlines or spaces with commas, if any
      .split(',') // build the array
      .map((i) => i.trim()) // ensure each item doesn't contain any white-space
      .filter(Boolean) // remove empty items

  return ignoreList
}

/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
const getInput = (name, options) => {
  const val =
    process.env[`${name.replace(/ /g, '_').toUpperCase()}`] || ''
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }

  return val.trim()
}

/**
 * Logs findings to console that are equal or above threshold
 *
 * @param     findings   list of findings
 * @param     threshold  threshold
 * @returns   void
 */
const logFindingsToConsole = (findings, threshold) => {
  console.log(`Vulnerabilities with severity >= ${threshold}:`)
  switch (threshold) {
    case "critical":
      findings.filter(({ severity }) => severity === "CRITICAL").forEach((finding) => console.log(finding));
      break;
    case "high":
      findings.filter(({ severity }) => severity === "CRITICAL").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "HIGH").forEach((finding) => console.log(finding));
      break;
    case "medium":
      findings.filter(({ severity }) => severity === "CRITICAL").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "HIGH").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "MEDIUM").forEach((finding) => console.log(finding));
      break;
    case "low":
      findings.filter(({ severity }) => severity === "CRITICAL").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "HIGH").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "MEDIUM").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "LOW").forEach((finding) => console.log(finding));
      break;
    case "informational":
      findings.filter(({ severity }) => severity === "CRITICAL").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "HIGH").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "MEDIUM").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "LOW").forEach((finding) => console.log(finding));
      findings.filter(({ severity }) => severity === "INFORMATIONAL").forEach((finding) => console.log(finding));
      break;
  }
}

const main = async () => {
  const repository = getInput('REPOSITORY', { required: true })
  const tag = getInput('TAG', { required: true })
  const failThreshold = getInput('FAIL_THRESHOLD') || 'high'
  const ignoreList = parseIgnoreList(getInput('IGNORE_LIST'))

  if (
    failThreshold !== 'critical' &&
    failThreshold !== 'high' &&
    failThreshold !== 'medium' &&
    failThreshold !== 'low' &&
    failThreshold !== 'informational'
  ) {
    throw new Error('fail_threshold input value is invalid')
  }
  console.debug(`Repository:${repository}, Tag:${tag}, Ignore list:${ignoreList}`)
  const ECR = new AWS.ECR()

  console.debug('Checking for existing findings')
  let status = null
  let findings = await getFindings(ECR, repository, tag, !!ignoreList.length)
  if (findings) {
    status = findings.imageScanStatus.status
    console.log(`A scan for this image was already requested, the scan's status is ${status}`)
    if (status == 'FAILED') {
      throw new Error(`Image scan failed: ${findings.imageScanStatus.description}`)
    }
  } else {
    console.log('Requesting image scan')
    await ECR.startImageScan({
      imageId: {
        imageTag: tag
      },
      repositoryName: repository
    }).promise()
    status = 'IN_PROGRESS'
  }

  let firstPoll = true
  while (status === 'IN_PROGRESS') {
    if (!firstPoll) {
      await new Promise((resolve) => {
        setTimeout(resolve, 5000)
      })
    }
    console.log('Polling ECR for image scan findings...')
    findings = await getFindings(ECR, repository, tag)
    status = findings.imageScanStatus.status
    console.debug(`Scan status: ${status}`)
    firstPoll = false
  }

  // Sanity check
  if (status !== 'COMPLETE') {
    throw new Error(`Unhandled scan status "${status}". API response: ${JSON.stringify(findings)}`)
  }

  const findingsList = await getAllFindings(ECR, repository, tag);
  const ignoredFindings = findingsList.filter(({ name }) => ignoreList.includes(name))
  const unignoredFindings = findingsList.filter(({ name }) => !ignoreList.includes(name))

  if (ignoreList.length !== ignoredFindings.length) {
    const missedIgnores = ignoreList.filter(name => !ignoredFindings.map(({ name }) => name).includes(name))
    console.log('The following CVEs were not found in the result set:')
    missedIgnores.forEach(miss => console.log(`  ${miss}`))
    throw new Error(`Ignore list contains CVE IDs that were not returned in the findings result set. They may be invalid or no longer be current vulnerabilities.`)
  }

  const ignoredCounts = countIgnoredFindings(ignoredFindings)
  const counts = findings.imageScanFindings.findingSeverityCounts
  const critical = counts.CRITICAL || 0
  const high = counts.HIGH || 0
  const medium = counts.MEDIUM || 0
  const low = counts.LOW || 0
  const informational = counts.INFORMATIONAL || 0
  const indeterminate = counts.UNDEFINED || 0
  const ignored = ignoredFindings.length
  const total = critical + high + medium + low + informational + indeterminate
  console.log('Vulnerabilities found:')
  console.log(`${critical.toString().padStart(3, ' ')} Critical ${getCount('critical', ignoredCounts)}`)
  console.log(`${high.toString().padStart(3, ' ')} High ${getCount('high', ignoredCounts)}`)
  console.log(`${medium.toString().padStart(3, ' ')} Medium ${getCount('medium', ignoredCounts)}`)
  console.log(`${low.toString().padStart(3, ' ')} Low ${getCount('low', ignoredCounts)}`)
  console.log(`${informational.toString().padStart(3, ' ')} Informational ${getCount('informational', ignoredCounts)}`)
  console.log(`${indeterminate.toString().padStart(3, ' ')} Undefined ${getCount('undefined', ignoredCounts)}`)
  console.log('=================')
  console.log(`${total.toString().padStart(3, ' ')} Total ${getCount('total', ignoredCounts)}`)

  const numFailingVulns =
    failThreshold === 'informational' ? total - ignoredCounts.informational
      : failThreshold === 'low' ? critical + high + medium + low - ignoredCounts.low
        : failThreshold === 'medium' ? critical + high + medium - ignoredCounts.medium
          : failThreshold === 'high' ? critical + high - ignoredCounts.high
            : /* failThreshold === 'critical' ? */ critical - ignoredCounts.critical

  if (numFailingVulns > 0) {
    // Log vulnerabilities above threshold to console
    logFindingsToConsole(unignoredFindings, failThreshold);
    throw new Error(`Detected ${numFailingVulns} vulnerabilities with severity >= ${failThreshold} (the currently configured fail_threshold).`)
  }
}

;(async function () {
  try {
    await main()
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
})()

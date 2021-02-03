
// pipeline

/**
  0. build image and push
  1. generate docker-compose file
  2. copy it to host to specific folder
  3. run docker-compose
 */

/**
        DRONE_REPO_NAME,
        DRONE_SOURCE_BRANCH,
        DRONE_COMMIT_MESSAGE,
        DRONE_BUILD_NUMBER,
        DRONE_COMMIT_AUTHOR,
        DRONE_BUILD_STATUS,
        DRONE_REPO_BRANCH,
 */

const fs = require('fs')
const path = require('path')
const { NodeSSH } = require('node-ssh')

const { getTag, escape, replaceTemplates, exec } = require('./utils')

const SSH = new NodeSSH()

const {
  PLUGIN_SSH_HOST,
  PLUGIN_SSH_USER,
  PLUGIN_SSH_KEY,
  PLUGIN_REGISTRY_USERNAME,
  PLUGIN_REGISTRY_PASSWORD,
  PLUGIN_REGISTRY_URL,
  PLUGIN_IMAGE,
  PLUGIN_COMPOSE_FILE = 'docker-compose.yml',
  PLUGIN_PATH,
  INPUT_SCRIPT,

  DRONE_SOURCE_BRANCH,
  // DRONE_REPO_BRANCH
} = process.env


checkParams()

if (!fs.existsSync(PLUGIN_COMPOSE_FILE)) {
  throw `docker-compose file "${PLUGIN_COMPOSE_FILE}" does not exist`
}

const COMPOSE_FILE = `docker-compose.yml`

const TAG = escape(getTag(DRONE_SOURCE_BRANCH))
const TARGET = path.join(PLUGIN_PATH, TAG)

main()

async function main() {

  const file = fs.readFileSync(PLUGIN_COMPOSE_FILE).toString()

  const COMPOSE_CONTENT = replaceTemplates(file,
    {
      IMAGE: PLUGIN_IMAGE,
      TAG: TAG
    })

  fs.writeFileSync(PLUGIN_COMPOSE_FILE, COMPOSE_CONTENT)

  const drone_commands = [
    `echo "${PLUGIN_REGISTRY_PASSWORD}" | docker login -u ${PLUGIN_REGISTRY_USERNAME} --password-stdin ${PLUGIN_REGISTRY_URL}`,
    `docker-compose -f ${PLUGIN_COMPOSE_FILE} build --pull`,
    `docker-compose -f ${PLUGIN_COMPOSE_FILE} push`
  ]

  const ssh_commands = [
    // `cd ${TARGET}`,
    `cat > ${COMPOSE_FILE} <<EOF ${COMPOSE_CONTENT} EOF`,
    `echo "${PLUGIN_REGISTRY_PASSWORD}" | docker login -u ${PLUGIN_REGISTRY_USERNAME} --password-stdin ${PLUGIN_REGISTRY_URL}`,
    `docker-compose -f ${COMPOSE_FILE} down`,
    `docker-compose -f ${COMPOSE_FILE} pull`,
    `docker-compose -f ${COMPOSE_FILE} up -d`
  ]

  console.log(
    'drone_commands',
    drone_commands
  )

  console.log(
    'ssh_commands',
    ssh_commands
  )

  if (INPUT_SCRIPT) {
    console.log(INPUT_SCRIPT)
  }

  console.log('build image...')
  drone_commands.forEach(command => {
    const res = exec(command)

    if (res.error) {
      throw res.error
    } else {
      console.log(res)
    }
  })

  console.log('deploy image...')
  await ssh(ssh_commands)

  async function ssh(commands) {
    console.log(`try connect to ${PLUGIN_SSH_USER}@${PLUGIN_SSH_HOST}...`)
    await SSH.connect({
      host: PLUGIN_SSH_HOST,
      username: PLUGIN_SSH_USER,
      privateKey: PLUGIN_SSH_KEY
    })
    if (SSH.isConnected()) {
      console.log('connect ok')
    } else {
      throw 'connection error'
    }

    await SSH.mkdir(TARGET, 'exec')

    for (const command of commands) {
      console.log('ssh exec', command)
      try {
        const { stdout, stderr } = await SSH.execCommand(command, { cwd: TARGET })
        if (stdout)
          console.log('stdout', stdout)
        if (stderr) {
          console.error('stderr', stderr)
          throw stderr
        }
      } catch (err) {
        if (!(err + '').toLowerCase().includes('warning')) {
          throw err
        }
      }
    }
    SSH.dispose()
  }

}

function checkParams() {
  const env = {
    PLUGIN_SSH_HOST,
    PLUGIN_SSH_USER,
    PLUGIN_SSH_KEY,
    PLUGIN_REGISTRY_USERNAME,
    PLUGIN_REGISTRY_PASSWORD,
    PLUGIN_REGISTRY_URL,
    PLUGIN_IMAGE,
    PLUGIN_COMPOSE_FILE,
    PLUGIN_PATH
  }

  if (Object.values(env).some(v => !v)) {
    throw 'the following environment variables are missing:\n' + Object.keys(env).filter(k => !env[k]).join('\n')
  }
}
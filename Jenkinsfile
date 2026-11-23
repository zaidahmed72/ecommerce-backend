pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 20, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  parameters {
    string(name: 'IMAGE_REPOSITORY', defaultValue: '', description: 'Optional registry image, e.g. ghcr.io/owner/zaid-ecommerce-api')
    booleanParam(name: 'PUBLISH_IMAGE', defaultValue: false, description: 'Push image (requires registry-credentials and authenticated Docker agent)')
    booleanParam(name: 'DEPLOY_PRODUCTION', defaultValue: false, description: 'Run protected deployment command on main only')
  }
  stages {
    stage('Checkout') {
      steps { checkout scm; script { env.GIT_COMMIT = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim(); env.IMAGE = "${params.IMAGE_REPOSITORY}:${env.GIT_COMMIT}" } }
    }
    stage('Validate') {
      steps { sh 'npm ci --ignore-scripts'; sh 'npm run check' }
    }
    stage('Build and smoke check') {
      steps {
        sh '''
          set -eu
          project="ci-${BUILD_NUMBER}"
          trap 'docker compose -p "$project" down -v >/dev/null 2>&1 || true' EXIT
          API_IMAGE="${IMAGE}" JWT_SECRET=01234567890123456789012345678901 docker compose -p "$project" up -d --build
          for attempt in $(seq 1 30); do
            if curl --fail --silent http://localhost:4000/health/live; then exit 0; fi
            sleep 2
          done
          docker compose -p "$project" logs
          exit 1
        '''
      }
    }
    stage('Publish image') {
      when { expression { return params.PUBLISH_IMAGE } }
      steps {
        script {
          if (!params.IMAGE_REPOSITORY?.trim()) error('Set IMAGE_REPOSITORY before publishing')
          withCredentials([usernamePassword(credentialsId: 'registry-credentials', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASSWORD')]) {
            sh 'echo "$REGISTRY_PASSWORD" | docker login "$(echo "$IMAGE_REPOSITORY" | cut -d/ -f1)" -u "$REGISTRY_USER" --password-stdin'
            sh 'docker push "${IMAGE}"'
            sh 'docker logout "$(echo "$IMAGE_REPOSITORY" | cut -d/ -f1)"'
          }
        }
      }
    }
    stage('Deploy production') {
      when { expression { (env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main') && params.DEPLOY_PRODUCTION && params.PUBLISH_IMAGE } }
      agent { label 'production' }
      steps {
        sh '''
          set -eu
          if [ -z "${IMAGE_REPOSITORY}" ]; then echo 'IMAGE_REPOSITORY is required' >&2; exit 1; fi
          if [ -z "${DEPLOY_COMMAND:-}" ]; then echo 'Configure DEPLOY_COMMAND in the protected Jenkins folder' >&2; exit 1; fi
          IMAGE="${IMAGE}" sh -c "$DEPLOY_COMMAND"
        '''
      }
    }
  }
  post {
    always { cleanWs() }
    success { echo "Pipeline completed for ${env.GIT_COMMIT}" }
  }
}

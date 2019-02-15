workflow "Install, Test, Compile" {
  on = "push"
  resolves = ["Compile"]
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "test"
}

action "Compile" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "build"
}
export async function updateUserProfile(user, input) {
  Object.assign(user, input)
  await user.save()
  return user
}

export async function updateCodeforcesHandle(user, codeforcesHandle) {
  user.codeforcesHandle = codeforcesHandle
  await user.save()
  return user
}

export async function updateUserPreferences(user, preferences) {
  user.preferences = { ...user.preferences.toObject(), ...preferences }
  await user.save()
  return user
}

// Frontend validation utilities
// Matches backend validation rules

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
        return 'Email is required'
    }
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address'
    }
    return null
}

export const validatePassword = (password, isRegistration = false) => {
    if (!password) {
        return 'Password is required'
    }
    if (isRegistration && password.length < 8) {
        return 'Password must be at least 8 characters'
    }
    return null
}

export const validateName = (name) => {
    if (!name || name.trim().length === 0) {
        return 'Name is required'
    }
    return null
}

export const validateHandle = (handle) => {
    if (!handle) {
        return 'Handle is required'
    }
    if (handle.length < 3) {
        return 'Handle must be at least 3 characters'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
        return 'Handle can only contain letters, numbers, and underscores'
    }
    return null
}

export const validateLoginForm = (email, password) => {
    const errors = {}

    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError

    const passwordError = validatePassword(password, false)
    if (passwordError) errors.password = passwordError

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

export const validateRegisterForm = (email, password, name, handle) => {
    const errors = {}

    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError

    const passwordError = validatePassword(password, true)
    if (passwordError) errors.password = passwordError

    const nameError = validateName(name)
    if (nameError) errors.name = nameError

    const handleError = validateHandle(handle)
    if (handleError) errors.handle = handleError

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

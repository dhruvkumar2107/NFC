import { NextResponse } from 'next/server'

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function unauthorized(message = 'Unauthorized') {
  return errorResponse(message, 401)
}

export function forbidden(message = 'Forbidden') {
  return errorResponse(message, 403)
}

export function notFound(message = 'Not found') {
  return errorResponse(message, 404)
}

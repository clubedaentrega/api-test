# user/login

## Setup
### user in users
	name: 'Guilherme'
	password: '12345'

## Wrong password (skip)
### Post
	user:
		name: user.name
		password: randomStr(5)
### Out
	error:
		code: 200
		message: String

## Valid
### Post
	user: user
### Out
	error: null
	id: user._id
	token: String
### Find in users
	user with token: out.token
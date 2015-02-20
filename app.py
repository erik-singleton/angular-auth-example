#!/usr/bin/env python
from flask import Flask, jsonify, session, url_for, request


app = Flask(__name__)
app.secret_key = 'SOMETHING SUPER SECRET BROTHER'



@app.after_request
def set_allow_origin(resp):
    origin = request.headers.get('Origin') or 'http://dev.eriksingleton.com'
    h = resp.headers

    h['Access-Control-Allow-Origin'] = origin
    h['Access-Control-Allow-Credentials'] = 'true'
    h['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    h['Access-Control-Allow-Headers'] = 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Mx-ReqToken,X-Requested-With'

    return resp


@app.route('/')
def hello():
    if 'username' in session:
        return jsonify(
            hello = 'World'
        )

    return jsonify(
        error = 'Not logged in'
    ), 401


@app.route('/menu')
def get_menu():
    menu = [
        {
            'title': 'My Profile',
            'slug': 'profile',
            'url': url_for('get_profile', _external=True)
        },
        {
            'title': 'My Deals',
            'slug': 'deals',
            'url': url_for('get_deals', _external=True)
        },
        {
            'title': 'Properties',
            'slug': 'properties',
            'url': url_for('get_properties', _external=True)
        },
    ] 
    if 'username' in session:
        if session['username'] == 'ben':
            return jsonify(menu=menu), 200
        elif session['username'] == 'admin':
            menu.append({
                'title': 'Tasks',
                'slug': 'tasks',
                'url': url_for('get_tasks', _external=True)
            })
            return jsonify(menu=menu), 200
        else:
            return jsonify(
                user = session['username']
            ), 200

    return jsonify(
        error = 'Not logged in'
    ), 401


@app.route('/tasks')
def get_tasks():
    if 'username' in session and session['username'] == 'admin':
        tasks = [
            {
                'title': 'Task1',
                'description': 'Use the force luke',
                'permissions': {
                    'edit': True
                }
            },
            {
                'title': 'Task2',
                'description': 'I shouldnt be editable',
                'permissions': {
                    'edit': False
                }
            }
        ]
        return jsonify(tasks=tasks), 200

    return jsonify(
        error = 'Not logged in'
    ), 401


@app.route('/profile')
def get_profile():
    if 'username' in session:
        profile = {
            'username': session['username'],
            'dingo': True
        }

        return jsonify(profile=profile), 200

    return jsonify(
        error = 'Not logged in'
    ), 401


@app.route('/deals')
def get_deals():
    if 'username' in session:
        deals = [
            {
                'title': 'Deal 1',
                'price': 50.00,
                'description': 'My price is editable',
                'permissions': {
                    'edit': True
                }
            },
            {
                'title': 'Deal 2',
                'price': 25.00,
                'description': 'My price is not',
                'permissions': {
                    'edit': False
                }
            }
        ]
        return jsonify(deals=deals), 200

    return jsonify(
        error = 'Not logged in'
    ), 401


@app.route('/properties')
def get_properties():
    properties = [
        {
            'title': 'Property 1',
            'description': 'Ben can see me!',
        },
        {
            'title': 'Property 2',
            'description': 'Ben won\'t be able to see property 3'
        }

    ]
    if 'username' in session:
        if session['username'] == 'ben':
            return jsonify(properties=properties), 200
        elif session['username'] == 'admin':
            properties.append({
                'title': 'Property 3',
                'description': 'Heheheh'
            })
            return jsonify(properties=properties), 200

    return jsonify(
        error = 'Not logged in'
    ), 401


@app.route('/login', methods=['POST'])
def login():
    session['username'] = request.json.get('username')
    return jsonify(
        json = request.json,
        logged_in = True
    )


@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify(
        logged_out = True
    )

if __name__ == '__main__':
    app.run(debug=True, port=5001)

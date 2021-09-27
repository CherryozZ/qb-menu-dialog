(function () {
	let MenuTpl =
		'<div id="menu_{{_namespace}}_{{_name}}" class="dialog {{#isBig}}big{{/isBig}}">' +
			'<div class="head"><span>{{title}}</span></div>' +
				'{{#isDefault}}<input type="text" name="value" id="inputText"/>{{/isDefault}}' +
				'{{#isBig}}<textarea name="value"/>{{/isBig}}' +
				'<button type="button" name="submit">Submit</button>' +
				'<button type="button" name="cancel">Cancel</button>' +
			'</div>' +
		'</div>'
	;

	window.QBCore_MENU = {};
	QBCore_MENU.ResourceName = 'qb-menu-dialog';
	QBCore_MENU.opened = {};
	QBCore_MENU.focus = [];
	QBCore_MENU.pos = {};

	QBCore_MENU.open = function (namespace, name, data) {
		if (typeof QBCore_MENU.opened[namespace] == 'undefined') {
			QBCore_MENU.opened[namespace] = {};
		}

		if (typeof QBCore_MENU.opened[namespace][name] != 'undefined') {
			QBCore_MENU.close(namespace, name);
		}

		if (typeof QBCore_MENU.pos[namespace] == 'undefined') {
			QBCore_MENU.pos[namespace] = {};
		}

		if (typeof data.type == 'undefined') {
			data.type = 'default';
		}

		if (typeof data.align == 'undefined') {
			data.align = 'top-left';
		}

		data._index = QBCore_MENU.focus.length;
		data._namespace = namespace;
		data._name = name;

		QBCore_MENU.opened[namespace][name] = data;
		QBCore_MENU.pos[namespace][name] = 0;

		QBCore_MENU.focus.push({
			namespace: namespace,
			name: name
		});

		document.onkeyup = function (key) {
			if (key.which == 27) { // Escape key
				SendMessage(QBCore_MENU.ResourceName, 'menu_cancel', data);
			} else if (key.which == 13) { // Enter key
				SendMessage(QBCore_MENU.ResourceName, 'menu_submit', data);
			}
		};

		QBCore_MENU.render();
	};

	QBCore_MENU.close = function (namespace, name) {
		delete QBCore_MENU.opened[namespace][name];

		for (let i = 0; i < QBCore_MENU.focus.length; i++) {
			if (QBCore_MENU.focus[i].namespace == namespace && QBCore_MENU.focus[i].name == name) {
				QBCore_MENU.focus.splice(i, 1);
				break;
			}
		}

		QBCore_MENU.render();
	};

	QBCore_MENU.render = function () {
		let menuContainer = $('#menus')[0];
		$(menuContainer).find('button[name="submit"]').unbind('click');
		$(menuContainer).find('button[name="cancel"]').unbind('click');
		$(menuContainer).find('[name="value"]').unbind('input propertychange');
		menuContainer.innerHTML = '';
		$(menuContainer).hide();

		for (let namespace in QBCore_MENU.opened) {
			for (let name in QBCore_MENU.opened[namespace]) {
				let menuData = QBCore_MENU.opened[namespace][name];
				let view = JSON.parse(JSON.stringify(menuData));

				switch (menuData.type) {

					case 'default': {
						view.isDefault = true;
						break;
					}

					case 'big': {
						view.isBig = true;
						break;
					}

					default: break;
				}

				let menu = $(Mustache.render(MenuTpl, view))[0];

				$(menu).css('z-index', 1000 + view._index);

				$(menu).find('button[name="submit"]').click(function () {
					QBCore_MENU.submit(this.namespace, this.name, this.data);
				}.bind({ namespace: namespace, name: name, data: menuData }));

				$(menu).find('button[name="cancel"]').click(function () {
					QBCore_MENU.cancel(this.namespace, this.name, this.data);
				}.bind({ namespace: namespace, name: name, data: menuData }));

				$(menu).find('[name="value"]').bind('input propertychange', function () {
					this.data.value = $(menu).find('[name="value"]').val();
					QBCore_MENU.change(this.namespace, this.name, this.data);
				}.bind({ namespace: namespace, name: name, data: menuData }));

				if (typeof menuData.value != 'undefined') {
					$(menu).find('[name="value"]').val(menuData.value);
				}

				menuContainer.appendChild(menu);
			}
		}

		$(menuContainer).show();
		$("#inputText").focus();
	};

	QBCore_MENU.submit = function (namespace, name, data) {
		SendMessage(QBCore_MENU.ResourceName, 'menu_submit', data);
	};

	QBCore_MENU.cancel = function (namespace, name, data) {
		SendMessage(QBCore_MENU.ResourceName, 'menu_cancel', data);
	};

	QBCore_MENU.change = function (namespace, name, data) {
		SendMessage(QBCore_MENU.ResourceName, 'menu_change', data);
	};

	QBCore_MENU.getFocused = function () {
		return QBCore_MENU.focus[QBCore_MENU.focus.length - 1];
	};

	window.onData = (data) => {
		switch (data.action) {

			case 'openMenu': {
				QBCore_MENU.open(data.namespace, data.name, data.data);
				break;
			}

			case 'closeMenu': {
				QBCore_MENU.close(data.namespace, data.name);
				break;
			}
		}
	};

	window.onload = function (e) {
		window.addEventListener('message', (event) => {
			onData(event.data);
		});
	};

})();

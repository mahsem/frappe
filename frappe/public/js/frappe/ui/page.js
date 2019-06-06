// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

/**
 * Make a standard page layout with a toolbar and title
 *
 * @param {Object} opts
 *
 * @param {string} opts.parent [HTMLElement] Parent element
 * @param {boolean} opts.single_column Whether to include sidebar
 * @param {string} [opts.title] Page title
 * @param {Object} [opts.make_page]
 *
 * @returns {frappe.ui.Page}
 */

/**
 * @typedef {Object} frappe.ui.Page
 */


frappe.ui.make_app_page = function(opts) {
	opts.parent.page = new frappe.ui.Page(opts);
	return opts.parent.page;
}

frappe.ui.pages = {};

frappe.ui.Page = Class.extend({
	init: function(opts) {
		$.extend(this, opts);

		this.set_document_title = true;
		this.buttons = {};
		this.fields_dict = {};
		this.views = {};

		this.make();
		frappe.ui.pages[frappe.get_route_str()] = this;
		this.setup_nav();
	},

	make: function() {
		this.wrapper = $(this.parent);
		this.add_main_section();
	},

	keyboard_shortcut(shortcut, element, namespace, is_std) {
		let shortcut_key = shortcut.replace(/ /g,'').toLowerCase();
		let $page = $(frappe.container.page);
		//For standard shortcuts
		if(is_std) {
			if(frappe.ui.keys.handlers[shortcut_key]) return;
			frappe.ui.keys.on(shortcut_key,(e)=> {
				e.preventDefault();
				if($page.find('.form-layout').is(':visible')) {
					$page.find('.menu-btn-group').find('a.grey-link').each((i,v)=> {
						if(v.textContent == element.get(0).textContent) {
							element = $(v);
						}
					});
				}
				this.shortcut_action(element);
			})
		//For alt shortcuts
		} else {
			$(document).on(namespace, null, shortcut_key, (e)=> {
				e.stopImmediatePropagation();
				e.preventDefault();

				this.shortcut_action(element);
			});
		}
	},

	shortcut_action(element) {
		if(element.attr('href') && element.attr('href')!='#') {
			window.location.href = element.attr('href');
		} else {
			element.click();
		}
	},

	setup_nav() {
		let menu_list, actions_list, el_list, sidebar_list, form_sidebar, navbar_breadcrumbs, dashboard_list;

		$(document).on('keydown', null, 'alt', (e)=> {
			e.stopImmediatePropagation();
			let $page = $(frappe.container.page);
			//Get list of elements
			let buttons = $page.find('.page-actions button').filter(':visible');
			menu_list = $page.find('.menu-btn-group ul li a').filter(':visible');
			actions_list = $page.find('.actions-btn-group ul li a').filter(':visible');
			sidebar_list = $page.find(".list-sidebar li:not('.divider') a:not('.disabled')").filter(':visible');
			form_sidebar = $page.find('.form-sidebar a:not(".close")').filter(':visible');
			navbar_breadcrumbs = $('#navbar-breadcrumbs a').filter(':visible');

			$.merge(buttons, navbar_breadcrumbs);
			//For list view
			if(sidebar_list.length) {
				$.merge(buttons, sidebar_list);
			}
			//For form view
			if(form_sidebar.length) {
				dashboard_list = $page.find('.transactions a').filter(':visible');
				$.merge(buttons, form_sidebar);
				$.merge(buttons, dashboard_list);
			}
			//Underline list of elements in menu dropdown
			if(menu_list.length) {
				menu_list = menu_list.add($page.find('.menu-btn-group').filter(':visible').find('button'));
				el_list = this.underline_alt_elements(menu_list, '.menu-item-label, .menu-btn-group-label');
			//Underline list of elements in actions dropdown
			} else if(actions_list.length) {
				actions_list.add($page.find('.actions-btn-group').filter(':visible'));
				el_list = this.underline_alt_elements(actions_list,'.menu-item-label');
			//Undeline all other elements-sidebar, navbar breadcrumbs, dashboard
			} else {
				el_list = this.underline_alt_elements(buttons);
			}
		});

		$(document).on('keyup',null, ()=> {
			//When alt released, remove undeline from all elements if any
			if(el_list) {
				this.remove_alt_elements(el_list);
			}
			
		});

	},

	underline_alt_elements($list, selector) {
		//If list of elements greater than 30, underline only 1st 30
		if($list.length > 20) {
			$list = $list.slice(0,20);
		}

		//[S,C,H] - already exist as shorcuts with Alt
		let char_list = ['S','C','H'], el_list = [];

		$.each($list,(i,v)=> {
			let $el = $(v);
			if($el.is(':visible')) {
				let el_obj={}, text;
				el_obj.$el = $el;
				if(selector) {
					text = $el.find(selector).text().trim();
				} else {
					text = $el.text().trim();
				}
				let i = 0;
				let char = text.charAt(0);
				//Find character to underline
				while(char_list.includes(char.toUpperCase())) {
					i++;
					char = text.charAt(i);
				}
				//Contains already chosen character
				char_list.push(char.toUpperCase());
				let new_text = this.underline_character(text,i);
				let new_html = $el.html().replace(text, new_text);
				let shortcut = 'alt+'+text.charAt(i);
				el_obj.shortcut = shortcut;
				el_list.push(el_obj);
				//Replace html
				$el.html(new_html);
			}
		});

		//Create shortcut for all undelined elements
		el_list.forEach((element)=> {
			if(element.$el.is(':visible')) {
				this.keyboard_shortcut(element.shortcut, element.$el, 'keyup.underline');
			}
		});

		return el_list;
	},

	remove_alt_elements($list) {
		//Remove underline from elements and unbind shortcuts
		$.each($list,(i,v)=> {
			if(v.$el.is(':visible')) {
				let new_html = this.remove_underline(v.$el.html());
				v.$el.html(new_html);
				$(document).off('keyup.underline');
			}
		});
	},

	underline_character(str, n) {
		let new_str;
		new_str = str.slice(0,n) + "<u>"+str.charAt(n)+"</u>" + str.slice(n+1);
		return new_str;
	},

	remove_underline(str) {
		let new_str = str.replace('<u>','').replace('</u>','');
		return new_str;
	},

	get_empty_state: function(title, message, primary_action) {
		let $empty_state = $(`<div class="page-card-container">
			<div class="page-card">
				<div class="page-card-head">
					<span class="indicator blue">
						${title}</span>
				</div>
				<p>${message}</p>
				<div>
					<button class="btn btn-primary btn-sm">${primary_action}</button>
				</div>
			</div>
		</div>`);

		return $empty_state;
	},

	load_lib: function(callback) {
		frappe.require(this.required_libs, callback);
	},

	add_main_section: function() {
		$(frappe.render_template("page", {})).appendTo(this.wrapper);
		if(this.single_column) {
			// nesting under col-sm-12 for consistency
			this.add_view("main", '<div class="row layout-main">\
					<div class="col-md-12 layout-main-section-wrapper">\
						<div class="layout-main-section"></div>\
						<div class="layout-footer hide"></div>\
					</div>\
				</div>');
		} else {
			this.add_view("main", '<div class="row layout-main">\
				<div class="col-md-2 layout-side-section"></div>\
				<div class="col-md-10 layout-main-section-wrapper">\
					<div class="layout-main-section"></div>\
					<div class="layout-footer hide"></div>\
				</div>\
			</div>');
		}

		this.setup_page();
	},

	setup_page: function() {
		this.$title_area = this.wrapper.find("h1");

		this.$sub_title_area = this.wrapper.find("h6");

		if(this.set_document_title!==undefined)
			this.set_document_title = this.set_document_title;

		if(this.title)
			this.set_title(this.title);

		if(this.icon)
			this.get_main_icon(this.icon);

		this.body = this.main = this.wrapper.find(".layout-main-section");
		this.sidebar = this.wrapper.find(".layout-side-section");
		this.footer = this.wrapper.find(".layout-footer");
		this.indicator = this.wrapper.find(".indicator");

		this.page_actions = this.wrapper.find(".page-actions");

		this.btn_primary = this.page_actions.find(".primary-action");
		this.btn_secondary = this.page_actions.find(".btn-secondary");

		this.menu = this.page_actions.find(".menu-btn-group .dropdown-menu");
		this.menu_btn_group = this.page_actions.find(".menu-btn-group");

		this.actions = this.page_actions.find(".actions-btn-group .dropdown-menu");
		this.actions_btn_group = this.page_actions.find(".actions-btn-group");

		this.page_form = $('<div class="page-form row hide"></div>').prependTo(this.main);
		this.inner_toolbar = $('<div class="form-inner-toolbar hide"></div>').prependTo(this.main);
		this.icon_group = this.page_actions.find(".page-icon-group");

		if(this.make_page) {
			this.make_page();
		}
	},

	set_indicator: function(label, color) {
		this.clear_indicator().removeClass("hide").html(`<span class='hidden-xs'>${label}</span>`).addClass(color);
	},

	add_action_icon: function(icon, click) {
		return $('<a class="text-muted no-decoration"><i class="'+icon+'"></i></a>')
			.appendTo(this.icon_group.removeClass("hide"))
			.click(click);
	},

	clear_indicator: function() {
		return this.indicator.removeClass().addClass("indicator whitespace-nowrap hide");
	},

	get_icon_label: function(icon, label) {
		return '<i class="visible-xs ' + icon + '"></i><span class="hidden-xs">' + label + '</span>'
	},

	set_action: function(btn, opts) {
		let me = this;
		if (opts.icon) {
			opts.label = this.get_icon_label(opts.icon, opts.label);
		}

		this.clear_action_of(btn);

		btn.removeClass("hide")
			.prop("disabled", false)
			.html(opts.label)
			.on("click", function() {
				let response = opts.click.apply(this);
				me.btn_disable_enable(btn, response);
			});

		if (opts.working_label) {
			btn.attr("data-working-label", opts.working_label);
		}
	},

	set_primary_action: function(label, click, icon, working_label) {
		this.set_action(this.btn_primary, {
			label: label,
			click: click,
			icon: icon,
			working_label: working_label
		});
		return this.btn_primary;

	},

	set_secondary_action: function(label, click, icon, working_label) {
		this.set_action(this.btn_secondary, {
			label: label,
			click: click,
			icon: icon,
			working_label: working_label
		});

		return this.btn_secondary;
	},


	clear_action_of: function(btn) {
		btn.addClass("hide").unbind("click").removeAttr("data-working-label");
	},

	clear_primary_action: function() {
		this.clear_action_of(this.btn_primary);
	},

	clear_secondary_action: function() {
		this.clear_action_of(this.btn_secondary);
	},

	clear_actions: function() {
		this.clear_primary_action();
		this.clear_secondary_action();
	},

	clear_icons: function() {
		this.icon_group.addClass("hide").empty();
	},

	//--- Menu --//

	add_menu_item: function(label, click, standard, shortcut) {
		return this.add_dropdown_item(label, click, standard, this.menu, shortcut);
	},

	clear_menu: function() {
		this.clear_btn_group(this.menu);
	},

	show_menu: function() {
		this.menu_btn_group.removeClass("hide");
	},

	hide_menu: function() {
		this.menu_btn_group.addClass("hide");
	},

	show_icon_group: function() {
		this.icon_group.removeClass("hide");
	},

	hide_icon_group: function() {
		this.icon_group.addClass("hide");
	},

	//--- Actions Menu--//

	show_actions_menu: function() {
		this.actions_btn_group.removeClass("hide");
	},

	hide_actions_menu: function() {
		this.actions_btn_group.addClass("hide");
	},


	add_action_item: function(label, click, standard) {
		return this.add_dropdown_item(label, click, standard, this.actions);
	},

	add_actions_menu_item: function(label, click, standard) {
		return this.add_dropdown_item(label, click, standard, this.actions, false);
	},

	clear_actions_menu: function() {
		this.clear_btn_group(this.actions);
	},


	//-- Generic --//

	/*
	* Add label to given drop down menu. If label, is already contained in the drop
	* down menu, it will be ignored.
	* @param {string} label - Text for the drop down menu
	* @param {function} click - function to be called when `label` is clicked
	* @param {Boolean} standard
	* @param {object} parent - DOM object representing the parent of the drop down item lists
	* @param {string} shortcut - Keyboard shortcut associated with the element
	* @param {Boolean} show_parent - Whether to show the dropdown button if dropdown item is added
	*/
	add_dropdown_item: function(label, click, standard, parent, shortcut, show_parent=true) {
		let item_selector = 'li > a.grey-link';
		if(show_parent) {
			parent.parent().removeClass("hide");
		}
		let $li;
		if(shortcut) {
			$li = $(`<li><a class="grey-link dropdown-item" href="#" onClick="return false;">
						<span class="menu-item-label">${label}</span>
						<span class="text-muted std-shortcut">${shortcut}</span>
					</a><li>`);
			this.keyboard_shortcut(shortcut, $li.find('a'), 'keyup.shortcut', true);
			shortcut = shortcut.replace(/ /g,'').toLowerCase();
		} else {
			$li = $('<li><a class="grey-link dropdown-item" href="#" onClick="return false;"><span class="menu-item-label">'
							+ label +'</span></a><li>');
		}
		var $link = $li.find("a").on("click", click);
		if (this.is_in_group_button_dropdown(parent, item_selector, label)) return;

		if(standard) {
			$li.appendTo(parent);
		} else {
			this.divider = parent.find(".divider");
			if(!this.divider.length) {
				this.divider = $('<li class="divider user-action"></li>').prependTo(parent);
			}
			$li.addClass("user-action").insertBefore(this.divider).addClass('visible-xs');
		}

		return $link;
	},

	/*
	* Check if there already exists a button with a specified label in a specified button group
	* @param {object} parent - This should be the `ul` of the button group.
	* @param {string} selector - CSS Selector of the button to be searched for. By default, it is `li`.
	* @param {string} label - Label of the button
	*/
	is_in_group_button_dropdown: function(parent, selector, label){
		if (!selector) selector = 'li';

		if (!label || !parent) return false;

		const result = $(parent).find(`${selector}:contains('${label}')`)
			.filter(function() {
				return $(this).text() === label;
			});
		return result.length > 0;
	},

	clear_btn_group: function(parent) {
		parent.empty();
		parent.parent().addClass("hide");
	},

	add_divider: function() {
		return $('<li class="divider"></li>').appendTo(this.menu);
	},

	get_or_add_inner_group_button: function(label) {
		var $group = this.inner_toolbar.find('.btn-group[data-label="'+encodeURIComponent(label)+'"]');
		if(!$group.length) {
			$group = $('<div class="btn-group" data-label="'+encodeURIComponent(label)+'" style="margin-left: 10px;">\
				<button type="button" class="btn btn-default dropdown-toggle btn-xs" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
				'+label+' <span class="caret"></span></button>\
				<ul role="menu" class="dropdown-menu" style="margin-top: -8px;"></ul></div>').appendTo(this.inner_toolbar);
		}
		return $group;
	},

	get_inner_group_button: function(label) {
		return this.inner_toolbar.find('.btn-group[data-label="'+encodeURIComponent(label)+'"]');
	},

	set_inner_btn_group_as_primary: function(label) {
		this.get_or_add_inner_group_button(label).find("button").removeClass("btn-default").addClass("btn-primary");
	},

	btn_disable_enable: function(btn, response) {
		if (response && response.then) {
			btn.prop('disabled', true);
			response.then(() => {
				btn.prop('disabled', false);
			})
		} else if (response && response.always) {
			btn.prop('disabled', true);
			response.always(() => {
				btn.prop('disabled', false);
			});
		}
	},

	/*
	* Add button to button group. If there exists another button with the same label,
	* `add_inner_button` will not add the new button to the button group even if the callback
	* function is different.
	*
	* @param {string} label - Label of the button to be added to the group
	* @param {object} action - function to be called when button is clicked
	* @param {string} group - Label of the group button
	*/
	add_inner_button: function(label, action, group, type="default") {
		var me = this;
		let _action = function() {
			let btn = $(this);
			let response = action();
			me.btn_disable_enable(btn, response);
		};
		if(group) {
			var $group = this.get_or_add_inner_group_button(group);
			$(this.inner_toolbar).removeClass("hide");

			if (!this.is_in_group_button_dropdown($group.find(".dropdown-menu"), 'li', label)) {
				return $('<li><a href="#" onclick="return false;" data-label="'+encodeURIComponent(label)+'">'+label+'</a></li>')
					.on('click', _action)
					.appendTo($group.find(".dropdown-menu"));
			}

		} else {
			var button = this.inner_toolbar.find('button[data-label="'+encodeURIComponent(label)+'"]');
			if( button.length == 0 ) {
				return $('<button data-label="'+encodeURIComponent(label)+`" class="btn btn-${type} btn-xs" style="margin-left: 10px;">`+__(label)+'</btn>')
					.on("click", _action)
					.appendTo(this.inner_toolbar.removeClass("hide"));
			} else {
				return button;
			}
		}
	},

	remove_inner_button: function(label, group) {
		if (typeof label === 'string') {
			label = [label];
		}
		// translate
		label = label.map(l => __(l));

		if (group) {
			var $group = this.get_inner_group_button(__(group));
			if($group.length) {
				$group.find('.dropdown-menu li a[data-label="'+encodeURIComponent(label)+'"]').remove();
			}
			if ($group.find('.dropdown-menu li a').length === 0) $group.remove();
		} else {

			this.inner_toolbar.find('button[data-label="'+encodeURIComponent(label)+'"]').remove();
		}
	},

	add_inner_message: function(message) {
		let $message = $(`<span class='inner-page-message text-muted small'>${message}</div>`);
		this.inner_toolbar.find('.inner-page-message').remove();
		this.inner_toolbar.removeClass("hide").prepend($message);

		return $message;
	},

	clear_inner_toolbar: function() {
		this.inner_toolbar.empty().addClass("hide");
	},

	//-- Sidebar --//

	add_sidebar_item: function(label, action, insert_after, prepend) {
		var parent = this.sidebar.find(".sidebar-menu.standard-actions");
		var li = $('<li>');
		var link = $('<a>').html(label).on("click", action).appendTo(li);

		if (insert_after) {
			li.insertAfter(parent.find(insert_after));
		} else {
			if(prepend) {
				li.prependTo(parent);
			} else {
				li.appendTo(parent);
			}
		}
		return link;
	},

	//---//

	clear_user_actions: function() {
		this.menu.find(".user-action").remove();
	},

	// page::title
	get_title_area: function() {
		return this.$title_area;
	},

	set_title: function(txt, icon = '', stripHtml = true, tabTitle = '') {
		if(!txt) txt = "";

		if(stripHtml) {
			txt = strip_html(txt);
		}
		this.title = txt;

		frappe.utils.set_title(tabTitle || txt);
		if(icon) {
			txt = '<span class="'+ icon +' text-muted" style="font-size: inherit;"></span> ' + txt;
		}
		this.$title_area.find(".title-text").html(txt);
	},

	set_title_sub: function(txt) {
		// strip icon
		this.$sub_title_area.html(txt).toggleClass("hide", !!!txt);
	},

	get_main_icon: function(icon) {
		return this.$title_area.find(".title-icon")
			.html('<i class="'+icon+' fa-fw"></i> ')
			.toggle(true);
	},

	add_help_button: function(txt) {
		//
	},

	add_button: function(label, click, icon, is_title) {
		//
	},

	add_dropdown_button: function(parent, label, click, icon) {
		frappe.ui.toolbar.add_dropdown_button(parent, label, click, icon);
	},

	// page::form
	add_label: function(label) {
		this.show_form();
		return $("<label class='col-md-1 page-only-label'>"+label+" </label>")
			.appendTo(this.page_form);
	},
	add_select: function(label, options) {
		var field = this.add_field({label:label, fieldtype:"Select"});
		return field.$wrapper.find("select").empty().add_options(options);
	},
	add_data: function(label) {
		var field = this.add_field({label: label, fieldtype: "Data"});
		return field.$wrapper.find("input").attr("placeholder", label);
	},
	add_date: function(label, date) {
		var field = this.add_field({label: label, fieldtype: "Date", "default": date});
		return field.$wrapper.find("input").attr("placeholder", label);
	},
	add_check: function(label) {
		return $("<div class='checkbox'><label><input type='checkbox'>" + label + "</label></div>")
			.appendTo(this.page_form)
			.find("input");
	},
	add_break: function() {
		// add further fields in the next line
		this.page_form.append('<div class="clearfix invisible-xs"></div>');
	},
	add_field: function(df) {
		this.show_form();

		if (!df.placeholder) {
			df.placeholder = df.label;
		}

		var f = frappe.ui.form.make_control({
			df: df,
			parent: this.page_form,
			only_input: df.fieldtype=="Check" ? false : true,
		})
		f.refresh();
		$(f.wrapper)
			.addClass('col-md-2')
			.attr("title", __(df.label)).tooltip();

		// html fields in toolbar are only for display
		if (df.fieldtype=='HTML') {
			return;
		}

		// hidden fields dont have $input
		if (!f.$input) f.make_input();

		f.$input.addClass("input-sm").attr("placeholder", __(df.label));

		if(df.fieldtype==="Check") {
			$(f.wrapper).find(":first-child")
				.removeClass("col-md-offset-4 col-md-8");
		}

		if(df.fieldtype=="Button") {
			$(f.wrapper).find(".page-control-label").html("&nbsp;")
			f.$input.addClass("btn-sm").css({"width": "100%", "margin-top": "-1px"});
		}

		if(df["default"])
			f.set_input(df["default"])
		this.fields_dict[df.fieldname || df.label] = f;
		return f;
	},
	clear_fields: function() {
		this.page_form.empty();
	},
	show_form: function() {
		this.page_form.removeClass("hide");
	},
	hide_form: function() {
		this.page_form.addClass("hide");
	},
	get_form_values: function() {
		var values = {};
		this.page_form.fields_dict.forEach(function(field, key) {
			values[key] = field.get_value();
		});
		return values;
	},
	add_view: function(name, html) {
		let element = html;
		if(typeof (html) === "string") {
			element = $(html);
		}
		this.views[name] = element.appendTo($(this.wrapper).find(".page-content"));
		if(!this.current_view) {
			this.current_view = this.views[name];
		} else {
			this.views[name].toggle(false);
		}
		return this.views[name];
	},
	set_view: function(name) {
		if(this.current_view_name===name)
			return;
		this.current_view && this.current_view.toggle(false);
		this.current_view = this.views[name];

		this.previous_view_name = this.current_view_name;
		this.current_view_name = name;

		this.views[name].toggle(true);

		this.wrapper.trigger('view-change');
	},
});

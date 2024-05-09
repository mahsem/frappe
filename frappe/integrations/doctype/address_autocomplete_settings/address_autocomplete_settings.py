# Copyright (c) 2024, Frappe Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

from .providers.geoapify import Geoapify


class AddressAutocompleteSettings(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		api_key: DF.Password | None
		enabled: DF.Check
		provider: DF.Literal["Geoapify"]
	# end: auto-generated types

	pass


@frappe.whitelist()
def autocomplete(txt: str) -> list[dict]:
	if not txt:
		return []

	settings = frappe.get_single("Address Autocomplete Settings")
	if not settings.enabled:
		return []

	if settings.provider == "Geoapify":
		AutocompleteProvider = Geoapify
	else:
		frappe.throw(_("This address autocomplete provider is not supported yet."))

	provider = AutocompleteProvider(settings.get_password("api_key"), frappe.local.lang)
	return provider.autocomplete(txt)

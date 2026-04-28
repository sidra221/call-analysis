from rest_framework.pagination import PageNumberPagination


class LargeDataPagination(PageNumberPagination):
    """
    Custom pagination class for endpoints that may return large datasets.
    Default page size is 20 records.
    Clients can override this using the 'page_size' query parameter,
    up to a maximum of 100 records per page.
    """

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
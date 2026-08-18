/**
 * Client-Side Product Pagination Handler for Watches of Switzerland
 * Divides available brand & catalog products into interactive pages (6 products per page)
 */
(function() {
    function initProductPagination() {
        const gridHolder = document.querySelector('.section-items .grid, .section-products .grid, #product-grid');
        if (!gridHolder) return;

        // Find all product columns
        const productCols = gridHolder.querySelectorAll('.grid__col:has(.product), .grid__col[data-columnize="no"]');
        if (productCols.length === 0) return;

        const PRODUCTS_PER_PAGE = 6;
        const totalProducts = productCols.length;
        const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

        // If only 1 page, hide pagination
        const paginationContainer = document.querySelector('#product-grid-pagination-shell, .pagination');
        if (totalPages <= 1) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            productCols.forEach(col => col.style.display = '');
            return;
        }

        let currentPage = 1;

        function showPage(page) {
            currentPage = page;
            const start = (page - 1) * PRODUCTS_PER_PAGE;
            const end = start + PRODUCTS_PER_PAGE;

            productCols.forEach((col, idx) => {
                if (idx >= start && idx < end) {
                    col.style.display = '';
                    col.style.opacity = '1';
                } else {
                    col.style.display = 'none';
                }
            });

            renderPagination();
        }

        function renderPagination() {
            if (!paginationContainer) return;
            paginationContainer.style.display = 'block';

            let html = '<ul>';

            // Prev button
            const prevDisabled = currentPage === 1 ? ' disabled' : '';
            html += `<li class="prev_page_link${prevDisabled}"><a class="page-link" href="#" data-page="${currentPage - 1}"><i class="ico-arrow-left"><svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g data-name="Group 5242" fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path data-name="Path 5371" d="M11.722.717l-10.286 10 10.286 10"/><path data-name="Line 726" d="M1.435 10.717h28"/></g></svg></i></a></li>`;

            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const activeClass = i === currentPage ? ' class="current"' : '';
                html += `<li${activeClass}><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }

            // Next button
            const nextDisabled = currentPage === totalPages ? ' disabled' : '';
            html += `<li class="next_page_link${nextDisabled}"><a class="page-link" href="#" data-page="${currentPage + 1}"><i class="ico-arrow-right"><svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g data-name="Group 5242" fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path data-name="Path 5371" d="M17.714.717l10.286 10-10.286 10"/><path data-name="Line 726" d="M28 10.717H0"/></g></svg></i></a></li>`;

            html += '</ul>';
            paginationContainer.innerHTML = html;

            // Attach click events
            paginationContainer.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetPage = parseInt(this.getAttribute('data-page'), 10);
                    if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
                        showPage(targetPage);
                        gridHolder.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }

        // Initialize Page 1
        showPage(1);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductPagination);
    } else {
        initProductPagination();
    }
})();

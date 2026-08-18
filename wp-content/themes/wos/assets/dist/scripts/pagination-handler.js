/**
 * Client-Side Product Pagination Handler for Watches of Switzerland
 * Divides brand listing products into interactive pages (18 products per page)
 */
(function() {
    function initProductPagination() {
        // Find only pure product columns (NOT news/article tiles)
        const allCols = document.querySelectorAll('.section-items .grid > .grid__col, .section-products .grid > .grid__col');
        if (allCols.length === 0) return;

        // Separate product columns from news/article tiles
        const productCols = [];
        const newsCols = [];
        allCols.forEach(function(col) {
            if (col.getAttribute('data-type') === 'news' || col.querySelector('.tile')) {
                newsCols.push(col);
            } else if (col.querySelector('.product') && col.getAttribute('data-columnize') === 'no') {
                productCols.push(col);
            }
        });

        if (productCols.length <= 0) return;

        // Hide all news/article tiles immediately (they're editorial blocks not products)
        newsCols.forEach(function(col) { col.style.display = 'none'; });

        const PRODUCTS_PER_PAGE = 18;
        const totalProducts = productCols.length;
        const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

        const paginationShell = document.getElementById('product-grid-pagination-shell');
        const paginationDetails = document.getElementById('product-grid-details');

        // Update the product count display
        if (paginationDetails) {
            paginationDetails.setAttribute('data-product-count', totalProducts);
            paginationDetails.setAttribute('data-page-count', totalPages);
        }

        if (totalPages <= 1 && paginationShell) {
            paginationShell.style.display = 'none';
            productCols.forEach(function(col) { col.style.display = ''; });
            return;
        }

        let currentPage = 1;

        function showPage(page) {
            currentPage = page;
            const start = (page - 1) * PRODUCTS_PER_PAGE;
            const end = start + PRODUCTS_PER_PAGE;

            productCols.forEach(function(col, idx) {
                col.style.display = (idx >= start && idx < end) ? '' : 'none';
            });

            renderPagination();
        }

        function buildArrowSvgLeft() {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g data-name="Group 5242" fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path data-name="Path 5371" d="M11.722.717l-10.286 10 10.286 10"/><path data-name="Line 726" d="M1.435 10.717h28"/></g></svg>';
        }
        function buildArrowSvgRight() {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="29.435" height="21.434"><g data-name="Group 5242" fill="none" stroke="#272727" stroke-miterlimit="10" stroke-width="2"><path data-name="Path 5371" d="M17.714.717l10.286 10-10.286 10"/><path data-name="Line 726" d="M28 10.717H0"/></g></svg>';
        }

        function buildPageNumbers() {
            // Show at most: first, ..., current-1, current, current+1, ..., last
            const pages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                if (currentPage > 3) pages.push('...');
                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    pages.push(i);
                }
                if (currentPage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
            }
            return pages;
        }

        function renderPagination() {
            if (!paginationShell) return;
            paginationShell.style.display = 'block';

            let html = '<ul>';

            // Prev
            const prevClass = currentPage === 1 ? ' class="prev_page_link disabled"' : ' class="prev_page_link"';
            html += `<li${prevClass}><a class="page-link" href="#" data-page="${currentPage - 1}"><i class="ico-arrow-left">${buildArrowSvgLeft()}</i></a></li>`;

            // Page numbers
            const pages = buildPageNumbers();
            pages.forEach(function(p) {
                if (p === '...') {
                    html += '<li class="dots"><span>…</span></li>';
                } else {
                    const activeClass = p === currentPage ? ' class="current"' : '';
                    html += `<li${activeClass}><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
                }
            });

            // Next
            const nextClass = currentPage === totalPages ? ' class="next_page_link disabled"' : ' class="next_page_link"';
            html += `<li${nextClass}><a class="page-link" href="#" data-page="${currentPage + 1}"><i class="ico-arrow-right">${buildArrowSvgRight()}</i></a></li>`;

            html += '</ul>';
            paginationShell.innerHTML = html;

            // Attach click events
            paginationShell.querySelectorAll('.page-link').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetPage = parseInt(this.getAttribute('data-page'), 10);
                    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
                        showPage(targetPage);
                        // Scroll smoothly to product grid
                        const sectionEl = document.querySelector('.section-items, .section-products');
                        if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

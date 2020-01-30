import axios from 'axios';

export async function getProduct(Id: number) {
    const response = await axios({
        url: `https://ts-catalogo-api.azurewebsites.net/Catalogo/Produto/${Id}`
    });
    response.data.Visivel == 'S' ? response.data.Visivel = true : response.data.Visivel = false;

    response.data.Categoria = [];
    for (var i = 0, lastCateg = '', numCategs = 0; i < response.data.Categorias.SubCategoriasHierarquia.length; i += 3) {
        if (lastCateg != response.data.Categorias.SubCategoriasHierarquia[i]) {
            lastCateg = response.data.Categorias.SubCategoriasHierarquia[i];
            const splitSubcategoria = response.data.Categorias.SubCategoriasHierarquia[i].split('/');
            response.data.Categoria[numCategs] = {};
            response.data.Categoria[numCategs].Departamento = splitSubcategoria[1];
            response.data.Categoria[numCategs].Categoria = splitSubcategoria[2];
            response.data.Categoria[numCategs].Subcategoria = splitSubcategoria[3];
            numCategs++;
        }
    }
    return response.data;
}

export async function getSkus(page: number, pageSize: number) {
    // retornar mensagem de erro se (pageSize > 100(?))
    const response = await axios({
        url: `https://tokstok.vtexcommercestable.com.br/api/catalog_system/pvt/sku/stockkeepingunitids?page=${page}&pagesize=${pageSize}`,
        headers: {
            'x-vtex-api-appToken': 'RMHXHAXJXLACKLNKYRAGENBXHOWLCZMVFXOMKYFUJJEWNMWTYPGVVBWELJQSDLHXZEWNWAAZLFWVIEKVRDNMTQADAKBAIMQYBGWIPJXXPGKPFAVGZVBAYUEJDSMLZARZ',
            'x-vtex-api-appKey': 'vtexappkey-tokstok-TCYTIY'
        }
    });
    return response.data;
}